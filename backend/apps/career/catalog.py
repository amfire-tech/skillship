"""
File:    backend/apps/career/catalog.py
Purpose: Static career catalogue + the two ZERO-AI interest mappers.
Owner:   Navanish

There is no Gemini call anywhere in this file. Interest detection is two cheap,
deterministic paths:
  1. from_subject_strengths() — maps the student's strongest quiz subjects to
     careers via keyword tags. Used as the default ("infer from quiz").
  2. interest_quiz.score()    — RIASEC scoring of the 20-question fallback quiz
     (see interest_quiz.py), which calls careers_for_riasec() here.

Each career is tagged with:
  - riasec  : Holland-code dimensions it leans on (R I A S E C).
  - subjects: keyword fragments matched against a school's free-text course names
              (course names vary per school, so we match on fragments, not exact).
"""

from __future__ import annotations

# Holland (RIASEC) dimensions: Realistic, Investigative, Artistic, Social,
# Enterprising, Conventional.
RIASEC = ("R", "I", "A", "S", "E", "C")

CAREERS: list[dict] = [
    {
        "slug": "software-engineer",
        "title": "Software Engineer",
        "riasec": ["I", "R"],
        "subjects": ["math", "computer", "coding", "code", "ai", "physics", "logic"],
        "blurb": "Build software, apps and systems. Strong logic and maths fit.",
    },
    {
        "slug": "data-scientist",
        "title": "Data Scientist",
        "riasec": ["I", "C"],
        "subjects": ["math", "statistic", "computer", "data", "ai", "economics"],
        "blurb": "Find patterns in data to drive decisions. Maths + coding.",
    },
    {
        "slug": "doctor",
        "title": "Doctor (MBBS)",
        "riasec": ["I", "S"],
        "subjects": ["bio", "science", "chemistry", "health"],
        "blurb": "Diagnose and treat patients. Biology and chemistry heavy.",
    },
    {
        "slug": "biotechnologist",
        "title": "Biotechnologist",
        "riasec": ["I", "R"],
        "subjects": ["bio", "chemistry", "science", "lab"],
        "blurb": "Apply biology to medicine, agriculture and industry.",
    },
    {
        "slug": "mechanical-engineer",
        "title": "Mechanical Engineer",
        "riasec": ["R", "I"],
        "subjects": ["physics", "math", "mechanic", "design", "robot"],
        "blurb": "Design machines and physical systems. Physics + maths.",
    },
    {
        "slug": "civil-engineer",
        "title": "Civil Engineer",
        "riasec": ["R", "C"],
        "subjects": ["physics", "math", "design", "geography"],
        "blurb": "Design and build infrastructure — roads, bridges, buildings.",
    },
    {
        "slug": "chartered-accountant",
        "title": "Chartered Accountant",
        "riasec": ["C", "E"],
        "subjects": ["account", "commerce", "math", "economics", "business"],
        "blurb": "Audit, tax and finance. Numbers and commerce.",
    },
    {
        "slug": "business-manager",
        "title": "Business / Management",
        "riasec": ["E", "S"],
        "subjects": ["business", "commerce", "economics", "social"],
        "blurb": "Lead teams and run organisations. People and enterprise.",
    },
    {
        "slug": "lawyer",
        "title": "Lawyer",
        "riasec": ["E", "S"],
        "subjects": ["english", "social", "history", "civic", "politic"],
        "blurb": "Argue, advise and uphold the law. Language and reasoning.",
    },
    {
        "slug": "civil-services",
        "title": "Civil Services (IAS/IPS)",
        "riasec": ["S", "E"],
        "subjects": ["social", "history", "civic", "geography", "english", "politic"],
        "blurb": "Serve in government administration. Broad general knowledge.",
    },
    {
        "slug": "designer",
        "title": "Designer (UX / Product / Graphic)",
        "riasec": ["A", "I"],
        "subjects": ["art", "design", "computer", "draw"],
        "blurb": "Craft how things look and work. Visual + creative.",
    },
    {
        "slug": "architect",
        "title": "Architect",
        "riasec": ["A", "R"],
        "subjects": ["art", "math", "design", "physics", "draw"],
        "blurb": "Design buildings and spaces. Art meets engineering.",
    },
    {
        "slug": "psychologist",
        "title": "Psychologist",
        "riasec": ["S", "I"],
        "subjects": ["bio", "social", "psych", "english"],
        "blurb": "Understand the mind and help people. Science + empathy.",
    },
    {
        "slug": "teacher-educator",
        "title": "Teacher / Educator",
        "riasec": ["S", "A"],
        "subjects": ["english", "social", "science", "math"],
        "blurb": "Teach and mentor the next generation.",
    },
    {
        "slug": "entrepreneur",
        "title": "Entrepreneur",
        "riasec": ["E", "I"],
        "subjects": ["business", "computer", "economics", "commerce"],
        "blurb": "Start and grow your own ventures. Drive and ideas.",
    },
    {
        "slug": "research-scientist",
        "title": "Research Scientist",
        "riasec": ["I", "R"],
        "subjects": ["physics", "chemistry", "bio", "math", "science"],
        "blurb": "Push the frontier of knowledge in a chosen field.",
    },
]

_BY_SLUG = {c["slug"]: c for c in CAREERS}


def get_career(slug: str) -> dict | None:
    return _BY_SLUG.get(slug)


def all_careers() -> list[dict]:
    return CAREERS


def _public(career: dict, *, score: float | None = None, reason: str = "") -> dict:
    out = {
        "slug": career["slug"],
        "title": career["title"],
        "blurb": career["blurb"],
    }
    if score is not None:
        out["match_pct"] = int(round(score))
    if reason:
        out["reason"] = reason
    return out


def from_subject_strengths(strengths: list[str], *, limit: int = 4) -> list[dict]:
    """Map the student's strongest subject names → careers, by keyword tags.
    Pure function, no AI. `strengths` is a list of free-text subject names."""
    norm = [s.lower() for s in strengths if s]
    scored: list[tuple[float, dict, str]] = []
    for career in CAREERS:
        hits = [
            subj for subj in norm
            if any(frag in subj for frag in career["subjects"])
        ]
        if not hits:
            continue
        # Earlier (stronger) subjects weigh more.
        score = 0.0
        for subj in hits:
            rank = norm.index(subj)
            score += 1.0 / (rank + 1)
        match_pct = min(95, 55 + score * 18)
        reason = f"Matches your strength in {', '.join(sorted(set(hits))[:2]).title()}."
        scored.append((match_pct, career, reason))

    scored.sort(key=lambda t: -t[0])
    return [_public(c, score=s, reason=r) for s, c, r in scored[:limit]]


def careers_for_riasec(scores: dict[str, float], *, limit: int = 4) -> list[dict]:
    """Rank careers by how well their RIASEC tags align with the quiz scores.
    `scores` maps each of R I A S E C to a 0..1 strength."""
    top_dims = sorted(RIASEC, key=lambda d: -scores.get(d, 0.0))[:3]
    scored: list[tuple[float, dict, str]] = []
    for career in CAREERS:
        match = sum(scores.get(d, 0.0) for d in career["riasec"])
        # Normalise by number of tags so 1-tag careers aren't penalised.
        match = match / max(1, len(career["riasec"]))
        if match <= 0:
            continue
        match_pct = min(96, 50 + match * 50)
        overlap = [d for d in career["riasec"] if d in top_dims]
        reason = "Fits your top interest areas." if overlap else "A possible direction to explore."
        scored.append((match_pct, career, reason))

    scored.sort(key=lambda t: -t[0])
    return [_public(c, score=s, reason=r) for s, c, r in scored[:limit]]
