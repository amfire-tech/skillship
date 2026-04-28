import re
import uuid

from django.contrib.auth.hashers import check_password, make_password
from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed

from .models import SchoolRecord, UserAuth

LOCKOUT_SECONDS = 60

ROLE_MAP = {
    'MAIN_ADMIN': 'Super Admin',
    'SUB_ADMIN':  'Sub Admin',
    'PRINCIPAL':  'Principal',
    'TEACHER':    'Teacher',
    'STUDENT':    'Student',
}

ROLE_PREFIX_MAP = {
    'SUB_ADMIN':  ('Sub Admin', 'SA'),
    'TEACHER':    ('Teacher',   'TE'),
    'PRINCIPAL':  ('Principal', 'PR'),
}


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()  # accepts user_id or email
    role = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        identifier = attrs['identifier'].strip()
        role = attrs['role'].strip().upper()
        password = attrs['password']

        db_role = ROLE_MAP.get(role, role)

        user = UserAuth.objects.filter(
            Q(user_id=identifier) | Q(email__iexact=identifier),
            role=db_role,
        ).first()

        if user is None:
            raise AuthenticationFailed('Invalid credentials.', code='invalid_credentials')

        if user.is_locked is True:
            raise AuthenticationFailed(
                'Account is permanently locked. Contact your administrator.',
                code='account_locked',
            )

        # 1-minute temporary lockout after a failed attempt
        lockout_key = f'lockout_{user.user_id}_{user.role}'
        if cache.get(lockout_key):
            raise AuthenticationFailed(
                'Too many failed attempts. Please wait 1 minute and try again.',
                code='temp_locked',
            )

        if not check_password(password, user.password_hash):
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            user.save(update_fields=['failed_login_attempts'])
            cache.set(lockout_key, True, LOCKOUT_SECONDS)
            raise AuthenticationFailed('Invalid credentials.', code='invalid_credentials')

        # Success — clear lockout, reset counter, record login time
        cache.delete(lockout_key)
        user.failed_login_attempts = 0
        user.last_login_at = timezone.now()
        user.save(update_fields=['failed_login_attempts', 'last_login_at'])

        attrs['user'] = user
        return attrs


class CreateUserSerializer(serializers.Serializer):
    full_name   = serializers.CharField()
    email       = serializers.EmailField()
    phone       = serializers.CharField(required=False, allow_blank=True, default='')
    password    = serializers.CharField(write_only=True, min_length=8)
    role        = serializers.CharField()
    school_code = serializers.CharField(required=False, allow_blank=True, default='')
    school_name = serializers.CharField(required=False, allow_blank=True, default='')
    class_grade = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_role(self, value):
        valid = set(ROLE_PREFIX_MAP.keys()) | {'STUDENT'}
        if value.upper() not in valid:
            raise serializers.ValidationError('Invalid role.')
        return value.upper()

    def validate_email(self, value):
        if UserAuth.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate(self, attrs):
        if attrs.get('role') == 'STUDENT':
            if not re.search(r'\d', attrs.get('class_grade', '')):
                raise serializers.ValidationError(
                    {'class_grade': 'Must contain a grade number (e.g. 9A, 10B).'}
                )
        return attrs

    def _next_user_id(self, prefix):
        existing = UserAuth.objects.filter(
            user_id__startswith=prefix
        ).values_list('user_id', flat=True)
        max_num = 0
        for uid in existing:
            try:
                num = int(uid[len(prefix):])
                if num > max_num:
                    max_num = num
            except ValueError:
                pass
        return f"{prefix}{max_num + 1:03d}"

    def _resolve_school(self, school_code, school_name):
        if not school_code:
            return None
        school = SchoolRecord.objects.filter(school_code=school_code).first()
        if school:
            return school.school_id
        new_school = SchoolRecord(
            school_id=uuid.uuid4(),
            school_name=school_name or school_code,
            school_code=school_code,
            is_active=True,
            created_at=timezone.now(),
        )
        new_school.save()
        return new_school.school_id

    def create(self, validated_data):
        role_key = validated_data['role']

        if role_key == 'STUDENT':
            db_role = 'Student'
            school_id = self._resolve_school(
                validated_data.get('school_code', ''),
                validated_data.get('school_name', ''),
            )
            school_name = validated_data.get('school_name', '') or validated_data.get('school_code', '')
            school_char = school_name[0].upper() if school_name else ''
            match = re.search(r'(\d+)\s*-?\s*([A-Za-z]?)', validated_data.get('class_grade', ''))
            clean_grade = (match.group(1) + match.group(2).upper()) if match else ''
            user_id = self._next_user_id(f"S{school_char}{clean_grade}")
        else:
            db_role, prefix = ROLE_PREFIX_MAP[role_key]
            school_id = None
            if role_key == 'PRINCIPAL':
                school_id = self._resolve_school(
                    validated_data.get('school_code', ''),
                    validated_data.get('school_name', ''),
                )
            user_id = self._next_user_id(prefix)

        user = UserAuth(
            id=uuid.uuid4(),
            user_id=user_id,
            full_name=validated_data['full_name'],
            email=validated_data['email'],
            phone=validated_data.get('phone', ''),
            password_hash=make_password(validated_data['password']),
            role=db_role,
            school_id=school_id,
            failed_login_attempts=0,
            is_locked=False,
            create_at=timezone.now(),
        )
        user.save()
        return user
