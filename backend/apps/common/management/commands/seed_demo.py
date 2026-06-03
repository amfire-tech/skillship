"""
File:    backend/apps/common/management/commands/seed_demo.py
Purpose: Idempotent demo seed — produces enough data to walk a school through a live demo.
Owner:   Navanish

Usage:
    python manage.py seed_demo               # top up missing rows, leave existing untouched
    python manage.py seed_demo --quiet       # no per-row output (CI / scripts)
    python manage.py seed_demo --reset       # delete demo rows first, then re-seed

Design rules:
    - Idempotent. Every row is `get_or_create` or `update_or_create` keyed on a
      stable natural key. Running this five times leaves the DB identical.
    - Never touches rows that aren't marked as demo (the slug / username / title
      pattern is the signal). `--reset` only wipes rows that match those patterns.
    - Plan 01 scope only. No risk signals, no AI tutor data, no orchestrator rows.
    - Generates a small set of completed QuizAttempts so the analytics dashboards
      render non-zero values during a demo. Attempts are directly inserted with
      realistic aggregates — we do NOT replay the take-quiz API path here.

What lands in the DB after a clean run:
    - 1 MAIN_ADMIN, 2 schools (CBSE + ICSE), 1 academic year per school
    - Per school: 1 principal, 1 sub-admin, 2 teachers, 6 students
    - Per school: 2 classes (9-A, 10-A), 3 courses (AI / Robotics / Coding)
    - Per course: 1 question bank, 10 questions, 1–2 published quizzes
    - Per course: 3 content items (PDF / video / article)
    - 5 marketplace listings (cross-school, public catalog)
    - 3 demo requests in different statuses (NEW / CONTACTED / CONVERTED)
    - ~12 submitted quiz attempts with realistic scores for analytics
"""

from __future__ import annotations

import random
import uuid
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

# Stable shared password for every seeded account. Documented in
# infra/DEPLOY.md so the demo team knows what to log in with.
DEMO_PASSWORD = "Skillship#Test-2026"

# Marker substrings used to identify demo rows during --reset. We never delete
# rows that don't carry one of these markers.
DEMO_SCHOOL_SLUGS = ("dps-demo", "skillship-north")
DEMO_USERNAME_PREFIX = "demo_"
DEMO_MARKETPLACE_TAG = "[Demo]"
DEMO_REQUEST_EMAIL_SUFFIX = "@demo.skillship.test"


class Command(BaseCommand):
    help = "Idempotently seed the Skillship database with enough data to demo Plan 01."

    def add_arguments(self, parser):
        parser.add_argument(
            "--quiet", action="store_true",
            help="Suppress per-row output; print only the final summary.",
        )
        parser.add_argument(
            "--reset", action="store_true",
            help="Delete all demo-marked rows before seeding (production-safe — never touches real data).",
        )

    # ── Entrypoint ──────────────────────────────────────────────────────────

    def handle(self, *args, **opts):
        self._quiet = opts["quiet"]

        if opts["reset"]:
            self._reset_demo_rows()

        with transaction.atomic():
            main_admin = self._seed_main_admin()
            schools = self._seed_schools()

            stats = {"users": 1, "schools": len(schools), "classes": 0, "courses": 0,
                     "questions": 0, "quizzes": 0, "attempts": 0, "content": 0}

            for school in schools:
                staff = self._seed_users_for_school(school)
                stats["users"] += sum(len(v) if isinstance(v, list) else 1 for v in staff.values())

                year = self._seed_academic_year(school)
                classes = self._seed_classes(school, year, staff["teachers"])
                stats["classes"] += len(classes)

                courses = self._seed_courses(school)
                stats["courses"] += len(courses)

                self._seed_enrollments(school, staff["students"], classes, courses)

                for course in courses:
                    bank, questions = self._seed_question_bank(school, course, staff["teachers"][0])
                    stats["questions"] += len(questions)
                    quizzes = self._seed_quizzes(school, course, bank, staff["teachers"][0])
                    stats["quizzes"] += len(quizzes)
                    stats["content"] += len(self._seed_content_items(school, course, staff["teachers"][0]))

                    # Generate analytics-grade attempts for the first quiz only,
                    # so a demo run lights up dashboards without taking forever.
                    if quizzes:
                        stats["attempts"] += len(
                            self._seed_quiz_attempts(school, quizzes[0], staff["students"])
                        )

            stats["listings"] = len(self._seed_marketplace_listings(schools[0]))
            stats["leads"] = len(self._seed_demo_requests())

        # MAIN_ADMIN counted separately above; ensure it stuck.
        _ = main_admin
        self._summary(stats)

    # ── Reset ───────────────────────────────────────────────────────────────

    def _reset_demo_rows(self):
        """Delete only the rows this seeder owns. Safe to run on prod.

        Several FKs in the schema are on_delete=PROTECT (User.school,
        Class.academic_year, Quiz.bank, QuizAttempt.quiz, QuizAttempt.student,
        etc.), so a plain `School.delete()` will refuse with ProtectedError.
        We delete from the leaves of the dependency graph inwards.
        """
        from apps.academics.models import AcademicYear, Class, Course, Enrollment
        from apps.accounts.models import User
        from apps.content.models import ContentItem, MarketplaceListing
        from apps.leads.models import DemoRequest
        from apps.quizzes.models import QuestionBank, Quiz, QuizAttempt
        from apps.schools.models import School

        demo_schools = School.objects.filter(slug__in=DEMO_SCHOOL_SLUGS)
        demo_school_ids = list(demo_schools.values_list("id", flat=True))

        # Leaf-first deletion. Order matters — each line clears protected
        # references for the line below.
        QuizAttempt.objects.filter(school_id__in=demo_school_ids).delete()
        Quiz.objects.filter(school_id__in=demo_school_ids).delete()
        QuestionBank.objects.filter(school_id__in=demo_school_ids).delete()  # cascades Question
        ContentItem.objects.filter(school_id__in=demo_school_ids).delete()
        Enrollment.objects.filter(school_id__in=demo_school_ids).delete()
        Class.objects.filter(school_id__in=demo_school_ids).delete()
        AcademicYear.objects.filter(school_id__in=demo_school_ids).delete()
        Course.objects.filter(school_id__in=demo_school_ids).delete()
        User.objects.filter(school_id__in=demo_school_ids).delete()
        # Now the schools have nothing protected pointing at them.
        demo_schools.delete()

        # Cross-school demo rows
        User.objects.filter(
            username__startswith=DEMO_USERNAME_PREFIX, school__isnull=True
        ).delete()
        MarketplaceListing.objects.filter(title__startswith=DEMO_MARKETPLACE_TAG).delete()
        DemoRequest.objects.filter(email_address__endswith=DEMO_REQUEST_EMAIL_SUFFIX).delete()
        self._log("OK Demo rows reset.")

    # ── MAIN_ADMIN ──────────────────────────────────────────────────────────

    def _seed_main_admin(self):
        from apps.accounts.models import User

        username = f"{DEMO_USERNAME_PREFIX}main_admin"
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": "platform@demo.skillship.test",
                "role": User.Role.MAIN_ADMIN,
                "school": None,
                "first_name": "Platform",
                "last_name": "Admin",
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save(update_fields=["password"])
            self._log(f"  + MAIN_ADMIN  {user.email}")
        return user

    # ── Schools ─────────────────────────────────────────────────────────────

    def _seed_schools(self):
        from apps.schools.models import School

        spec = [
            {
                "slug": "dps-demo", "name": "Delhi Public School — Demo Campus",
                "board": School.Board.CBSE, "city": "New Delhi", "state": "Delhi",
                "address": "Sector 24, Rohini, New Delhi",
            },
            {
                "slug": "skillship-north", "name": "Skillship North Academy",
                "board": School.Board.ICSE, "city": "Mumbai", "state": "Maharashtra",
                "address": "Bandra West, Mumbai",
            },
        ]
        out = []
        for s in spec:
            school, created = School.objects.get_or_create(
                slug=s["slug"],
                defaults={**s, "plan": School.Plan.CORE, "is_active": True},
            )
            if created:
                self._log(f"  + SCHOOL     {school.name}")
            out.append(school)
        return out

    # ── Users per school ────────────────────────────────────────────────────

    def _seed_users_for_school(self, school):
        from apps.accounts.models import User

        prefix = f"{DEMO_USERNAME_PREFIX}{school.slug.replace('-', '_')}"
        ids = {
            "principal": (f"{prefix}_principal", User.Role.PRINCIPAL, "Anita", "Sharma"),
            "sub_admin": (f"{prefix}_sub_admin", User.Role.SUB_ADMIN, "Ravi", "Iyer"),
        }
        teachers_spec = [
            (f"{prefix}_teacher_1", "Priya", "Verma"),
            (f"{prefix}_teacher_2", "Manish", "Gupta"),
        ]
        students_spec = [
            (f"{prefix}_student_{i+1}", first, last)
            for i, (first, last) in enumerate([
                ("Arjun", "Patel"), ("Diya", "Nair"), ("Kabir", "Singh"),
                ("Meera", "Reddy"), ("Rohan", "Kumar"), ("Ananya", "Joshi"),
            ])
        ]

        def upsert(username, role, first_name, last_name):
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": f"{username}@demo.skillship.test",
                    "role": role,
                    "school": school,
                    "first_name": first_name,
                    "last_name": last_name,
                },
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save(update_fields=["password"])
                self._log(f"  + {role:<10} {user.email}")
            return user

        out = {
            "principal": upsert(*ids["principal"]),
            "sub_admin": upsert(*ids["sub_admin"]),
            "teachers": [upsert(u, User.Role.TEACHER, f, l) for (u, f, l) in teachers_spec],
            "students": [upsert(u, User.Role.STUDENT, f, l) for (u, f, l) in students_spec],
        }
        return out

    # ── Academic year + classes + courses ───────────────────────────────────

    def _seed_academic_year(self, school):
        from apps.academics.models import AcademicYear

        year, created = AcademicYear.objects.get_or_create(
            school=school, name="2025-26",
            defaults={
                "start_date": date(2025, 6, 1),
                "end_date": date(2026, 5, 31),
                "is_current": True,
            },
        )
        if created:
            self._log(f"  + YEAR       {year.name} @ {school.slug}")
        return year

    def _seed_classes(self, school, year, teachers):
        from apps.academics.models import Class

        spec = [(9, "A", teachers[0]), (10, "A", teachers[1])]
        out = []
        for grade, section, klass_teacher in spec:
            klass, created = Class.objects.get_or_create(
                school=school, academic_year=year, grade=grade, section=section,
                defaults={"class_teacher": klass_teacher},
            )
            if created:
                self._log(f"  + CLASS      Grade {grade}-{section} @ {school.slug}")
            out.append(klass)
        return out

    def _seed_courses(self, school):
        from apps.academics.models import Course

        spec = [
            ("AI-INTRO", "Introduction to AI", Course.Stream.AI),
            ("ROBOT-101", "Robotics Fundamentals", Course.Stream.ROBOT),
            ("CODE-101", "Coding Foundations", Course.Stream.CODE),
        ]
        out = []
        for code, name, stream in spec:
            course, created = Course.objects.get_or_create(
                school=school, code=code,
                defaults={
                    "name": name, "stream": stream, "grade_min": 6, "grade_max": 12,
                    "description": f"{name} — demo course covering Plan 01 scope.",
                },
            )
            if created:
                self._log(f"  + COURSE     {code} @ {school.slug}")
            out.append(course)
        return out

    def _seed_enrollments(self, school, students, classes, courses):
        from apps.academics.models import Enrollment

        # Half the students go in Grade 9-A, half in 10-A. Each is enrolled in
        # all three courses so analytics has per-course coverage.
        for i, student in enumerate(students):
            klass = classes[i % len(classes)]
            for course in courses:
                Enrollment.objects.get_or_create(
                    school=school, student=student, klass=klass, course=course,
                )

    # ── Question bank + questions ───────────────────────────────────────────

    def _seed_question_bank(self, school, course, author):
        from apps.quizzes.models import Question, QuestionBank

        bank, created = QuestionBank.objects.get_or_create(
            school=school, course=course, name=f"{course.code} — Core Bank",
            defaults={
                "description": f"Demo question bank for {course.name}.",
                "created_by": author,
            },
        )
        if created:
            self._log(f"  + BANK       {bank.name}")

        # 10 questions per bank: 6 MCQ, 2 TRUE_FALSE, 2 SHORT_ANSWER.
        # Difficulty mix: 3 EASY, 5 MEDIUM, 2 HARD.
        templates = [
            ("MCQ", "EASY",   f"In {course.name}, which option is the basic principle?",
                [("a", "Pattern recognition"), ("b", "Random guessing"), ("c", "Memorisation"), ("d", "Skipping steps")], ["a"]),
            ("MCQ", "EASY",   f"{course.name} primarily helps students learn about:",
                [("a", "History"), ("b", "Modern technology"), ("c", "Sports"), ("d", "Music")], ["b"]),
            ("MCQ", "EASY",   "Which of these is a 21st-century skill?",
                [("a", "Critical thinking"), ("b", "Daydreaming"), ("c", "Avoiding problems"), ("d", "Copying answers")], ["a"]),
            ("MCQ", "MEDIUM", f"Which tool is commonly used in {course.name}?",
                [("a", "Notebook only"), ("b", "Computer + software"), ("c", "Slate"), ("d", "Typewriter")], ["b"]),
            ("MCQ", "MEDIUM", "Best practice when stuck on a problem:",
                [("a", "Give up"), ("b", "Break it down"), ("c", "Skip it forever"), ("d", "Copy a friend")], ["b"]),
            ("MCQ", "HARD",   f"Advanced application of {course.name} involves:",
                [("a", "Static rules"), ("b", "Adaptive systems"), ("c", "Random chance"), ("d", "Manual labour")], ["b"]),
            ("TRUE_FALSE", "EASY",   f"{course.name} is part of the Skillship Plan 01 curriculum.",
                [("true", "True"), ("false", "False")], ["true"]),
            ("TRUE_FALSE", "MEDIUM", "All AI systems can learn without any human input.",
                [("true", "True"), ("false", "False")], ["false"]),
            ("SHORT_ANSWER", "MEDIUM", f"Name one career path enabled by {course.name}.", [], []),
            ("SHORT_ANSWER", "HARD",   f"Briefly describe an everyday use of {course.name}.", [], []),
        ]

        out = []
        for type_, diff, text, opts, correct in templates:
            options = [{"id": oid, "text": otext} for oid, otext in opts]
            q, created = Question.objects.get_or_create(
                school=school, bank=bank, text=text,
                defaults={
                    "type": type_, "difficulty": diff,
                    "options": options, "correct_option_ids": correct,
                    "accepted_answers": ["career", "everyday"] if type_ == "SHORT_ANSWER" else [],
                    "points": 1 if diff == "EASY" else (2 if diff == "MEDIUM" else 3),
                    "tags": [course.stream.lower()],
                    "created_by": author,
                },
            )
            out.append(q)
        return bank, out

    # ── Quizzes ─────────────────────────────────────────────────────────────

    def _seed_quizzes(self, school, course, bank, author):
        from apps.quizzes.models import Quiz

        spec = [
            (f"{course.name} — Diagnostic", 20, 10, False),
            (f"{course.name} — Mid-Unit Test", 30, 10, True),  # adaptive=True
        ]
        out = []
        for title, duration, total_q, is_adaptive in spec:
            quiz, created = Quiz.objects.get_or_create(
                school=school, course=course, title=title,
                defaults={
                    "bank": bank,
                    "description": f"Auto-seeded demo quiz for {course.name}.",
                    "status": Quiz.Status.PUBLISHED,
                    "is_adaptive": is_adaptive,
                    "duration_minutes": duration,
                    "total_questions": total_q,
                    "pass_percentage": 50,
                    "published_at": timezone.now(),
                    "created_by": author,
                },
            )
            if created:
                self._log(f"  + QUIZ       {title}")
            out.append(quiz)
        return out

    # ── Content items ──────────────────────────────────────────────────────

    def _seed_content_items(self, school, course, uploader):
        from apps.content.models import ContentItem

        spec = [
            ("PDF",     f"{course.name} — Reference Sheet",
                "https://example.com/demo/reference.pdf", 0),
            ("VIDEO",   f"{course.name} — Intro (10 min)",
                "https://example.com/demo/intro.mp4", 600),
            ("ARTICLE", f"{course.name} — Why It Matters",
                "https://example.com/demo/article.html", 0),
        ]
        out = []
        for kind, title, url, duration in spec:
            item, created = ContentItem.objects.get_or_create(
                school=school, course=course, title=title,
                defaults={
                    "kind": kind, "file_url": url,
                    "duration_seconds": duration,
                    "description": f"Demo content for {course.name}.",
                    "uploaded_by": uploader,
                    "ai_tags": [course.stream.lower(), kind.lower()],
                },
            )
            out.append(item)
        return out

    # ── Marketplace listings (global / cross-school) ────────────────────────

    def _seed_marketplace_listings(self, author_school):
        from apps.content.models import MarketplaceListing

        # Field order: title, kind, price, featured, category, difficulty,
        # duration_key, duration_label, class_range, cover_image_url.
        spec = [
            ("[Demo] AI Vision Lab",
             "INTERACTIVE", "18999.00", True,
             "ai", "intermediate", "under-2-hours", "2 hours", "Class 6-8",
             "/workshops/ai-workshop.svg"),
            ("[Demo] Robotics Foundations Lab",
             "VIDEO", "14999.00", True,
             "robotics", "beginner", "under-2-hours", "90 minutes", "Class 3-5",
             "/workshops/robotics-workshop.svg"),
            ("[Demo] Creative Coding Lab",
             "COURSE", "16999.00", True,
             "coding", "beginner", "multi-session", "2 sessions", "Class 6-8",
             "/workshops/coding-workshop.svg"),
            ("[Demo] STEM Career Pathways Guide",
             "PDF", "0.00", False,
             "ai", "advanced", "multi-session", "3 sessions", "Class 9-12",
             "/workshops/ai-workshop.svg"),
            ("[Demo] IoT Systems Starter",
             "ARTICLE", "22999.00", False,
             "iot", "intermediate", "half-day", "Half day", "Class 8-10",
             "/workshops/ai-workshop.svg"),
        ]
        out = []
        for (title, kind, price, featured, category, difficulty,
             duration_key, duration_label, class_range, cover) in spec:
            listing, created = MarketplaceListing.objects.update_or_create(
                title=title,
                defaults={
                    "description": (
                        f"Skillship's {title.replace('[Demo] ', '')} — hands-on, classroom-tested workshop."
                    ),
                    "author_school": author_school,
                    "kind": kind,
                    "price_inr": Decimal(price),
                    "file_url": "https://example.com/demo/workshop.html",
                    "cover_image_url": cover,
                    "is_active": True,
                    "featured": featured,
                    "category": category,
                    "difficulty": difficulty,
                    "duration_key": duration_key,
                    "duration_label": duration_label,
                    "class_range": class_range,
                },
            )
            if created:
                self._log(f"  + LISTING    {title}")
            out.append(listing)
        return out

    # ── Demo requests (sales leads) ─────────────────────────────────────────

    def _seed_demo_requests(self):
        from apps.leads.models import DemoRequest

        spec = [
            ("Lotus Valley International",   "Sushmita Rao",  "Gurugram", "501-1000",
             "+91-9988776655", f"lotus{DEMO_REQUEST_EMAIL_SUFFIX}",  "cbse",       DemoRequest.Status.NEW),
            ("Greenfield Public School",      "Vivek Khanna",  "Bengaluru","251-500",
             "+91-9123456780", f"green{DEMO_REQUEST_EMAIL_SUFFIX}",  "icse",       DemoRequest.Status.CONTACTED),
            ("St. Anne's High School",        "Lily D'Souza",  "Pune",     "up-to-250",
             "+91-9445566778", f"stanne{DEMO_REQUEST_EMAIL_SUFFIX}", "state-board",DemoRequest.Status.CONVERTED),
        ]
        out = []
        for name, principal, city, srange, phone, email, board, status in spec:
            lead, created = DemoRequest.objects.get_or_create(
                email_address=email,
                defaults={
                    "school_name": name, "principal_name": principal, "city": city,
                    "student_range": srange, "phone_number": phone,
                    "school_board": board, "status": status,
                },
            )
            if created:
                self._log(f"  + LEAD       {name} [{status}]")
            out.append(lead)
        return out

    # ── Quiz attempts (so analytics dashboards have data to render) ─────────

    def _seed_quiz_attempts(self, school, quiz, students):
        from apps.quizzes.models import QuizAttempt

        # Deterministic RNG keyed on quiz id so re-runs produce the same scores.
        rng = random.Random(int(uuid.UUID(str(quiz.id)).int) & 0xFFFF)

        out = []
        for student in students:
            existing = QuizAttempt.objects.filter(quiz=quiz, student=student).first()
            if existing:
                out.append(existing)
                continue

            score = Decimal(rng.choice([45, 55, 60, 70, 75, 80, 85, 90]))
            correct = int((score / 100) * quiz.total_questions)
            points_total = quiz.total_questions * 2  # average MEDIUM weight
            points_earned = int((score / 100) * points_total)
            started = timezone.now() - timedelta(days=rng.randint(1, 25))
            submitted = started + timedelta(minutes=rng.randint(8, quiz.duration_minutes))

            attempt = QuizAttempt.objects.create(
                school=school, quiz=quiz, student=student,
                status=QuizAttempt.Status.SUBMITTED,
                attempt_number=1,
                started_at=started,
                expires_at=started + timedelta(minutes=quiz.duration_minutes),
                submitted_at=submitted,
                score_percent=score,
                points_earned=points_earned,
                points_total=points_total,
                correct_count=correct,
                question_order=[],  # not needed for analytics aggregates
            )
            # `started_at` has auto_now_add — Django wrote NOW(). Backdate it explicitly.
            QuizAttempt.objects.filter(pk=attempt.pk).update(started_at=started)
            out.append(attempt)
        return out

    # ── Helpers ─────────────────────────────────────────────────────────────

    def _log(self, msg):
        if not self._quiet:
            self.stdout.write(msg)

    def _summary(self, stats):
        # Plain ASCII only — Windows default cp1252 consoles choke on box-drawing
        # / check-mark glyphs and the whole command crashes after a successful seed.
        self.stdout.write(self.style.SUCCESS(
            "\nOK Seed complete\n"
            f"  schools   : {stats['schools']}\n"
            f"  users     : {stats['users']}\n"
            f"  classes   : {stats['classes']}\n"
            f"  courses   : {stats['courses']}\n"
            f"  questions : {stats['questions']}\n"
            f"  quizzes   : {stats['quizzes']}\n"
            f"  attempts  : {stats['attempts']}\n"
            f"  content   : {stats['content']}\n"
            f"  listings  : {stats['listings']}\n"
            f"  leads     : {stats['leads']}\n"
            f"\nPassword for every seeded account: {DEMO_PASSWORD}\n"
        ))
