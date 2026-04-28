import uuid
from django.db import models


class SchoolRecord(models.Model):
    school_id   = models.UUIDField(primary_key=True, default=uuid.uuid4)
    school_name = models.TextField(blank=True)
    school_code = models.CharField(max_length=100, blank=True)
    address     = models.TextField(blank=True)
    email       = models.TextField(blank=True)
    phone       = models.CharField(max_length=50, blank=True)
    logo_url    = models.TextField(blank=True)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'school'


class UserAuth(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user_id = models.CharField(max_length=50)
    school_id = models.UUIDField(null=True, blank=True)
    email = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    password_hash = models.TextField()
    role = models.CharField(max_length=20)
    refresh_token_hash = models.TextField(null=True, blank=True)
    failed_login_attempts = models.IntegerField(default=0)
    is_locked = models.BooleanField(default=False)
    last_login_at = models.DateTimeField(null=True, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    create_at = models.DateTimeField(null=True, blank=True)
    full_name = models.CharField(max_length=255, blank=True)

    class Meta:
        managed = False
        db_table = 'user_auth'
