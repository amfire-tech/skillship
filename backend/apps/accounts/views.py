from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import CreateUserSerializer, LoginSerializer

ROLE_KEY_MAP = {
    'Super Admin': 'MAIN_ADMIN',
    'Sub Admin':   'SUB_ADMIN',
    'Principal':   'PRINCIPAL',
    'Teacher':     'TEACHER',
    'Student':     'STUDENT',
}


class LoginView(APIView):
    authentication_classes: list = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        return Response({
            'user_id':   user.user_id,
            'email':     user.email,
            'full_name': user.full_name,
            'role':      ROLE_KEY_MAP.get(user.role, user.role),
            'school_id': str(user.school_id) if user.school_id else None,
        }, status=status.HTTP_200_OK)


class CreateUserView(APIView):
    authentication_classes: list = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user_id':   user.user_id,
            'full_name': user.full_name,
            'email':     user.email,
            'role':      request.data.get('role'),
        }, status=status.HTTP_201_CREATED)
