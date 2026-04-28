from django.urls import path

from . import views

app_name = 'accounts'

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('users/create/', views.CreateUserView.as_view(), name='create-user'),
]
