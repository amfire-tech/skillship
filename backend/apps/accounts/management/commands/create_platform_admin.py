"""
Usage:
    python manage.py create_platform_admin \
        --email owner@myschool.com \
        --password MySecurePass123 \
        --name "Rajesh Kumar"

Creates the one-and-only MAIN_ADMIN (platform owner) if it does not exist.
Safe to run multiple times — skips silently if the email already exists.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError


class Command(BaseCommand):
    help = "Create the platform super admin (MAIN_ADMIN) account."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Owner email address")
        parser.add_argument("--password", required=True, help="Owner password")
        parser.add_argument("--name", default="Platform Admin", help="Full name (default: Platform Admin)")

    def handle(self, *args, **options):
        from apps.accounts.models import User

        email = options["email"].strip().lower()
        password = options["password"]
        full_name = options["name"].strip()

        name_parts = full_name.split(" ", 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING(
                f"Super admin with email '{email}' already exists. Nothing changed."
            ))
            return

        username = email.split("@")[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        try:
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
            )
            self.stdout.write(self.style.SUCCESS(
                f"\n✓ Super admin created successfully!\n"
                f"  Email   : {email}\n"
                f"  Name    : {full_name}\n"
                f"  Role    : MAIN_ADMIN\n\n"
                f"  Use these credentials to log in at the platform.\n"
            ))
        except IntegrityError as e:
            raise CommandError(f"Failed to create super admin: {e}")
