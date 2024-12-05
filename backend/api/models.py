from django.db import models
from django.core.validators import RegexValidator, EmailValidator
from django.contrib.auth.models import AbstractBaseUser
from django.urls import reverse

from .managers import UserManager

class User(AbstractBaseUser):
    id = models.AutoField(primary_key=True)
    username = models.CharField(
        max_length=50,
        unique=True,
        validators=[RegexValidator(regex=r'^[a-zA-Z0-9]*$', message="Username must contain only alphanumeric characters")]
    )
    email = models.EmailField(
        max_length=255,
        unique=True,
        validators=[EmailValidator()],
        null=True
    )
    avatar_url = models.CharField(max_length=255, blank=True, null=True)
    email_token = models.CharField(max_length=32, blank=True, null=True)
    online = models.BooleanField(default=False)
    intra_user = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = UserManager()  # Use the custom manager

    def has_usable_password(self):
        return not self.intra_user and self.email_verified and super().has_usable_password()

    def generate_verification_link(self):
        token = self.email_token
        verification_route = reverse('verify-email', kwargs={'token': token})
        print(f"verification route: {verification_route}")
        return f"http://localhost{verification_route}"
    
    def send_email(self, message):
        print(f"📧: {message}")

    def __str__(self):
        fields = [f"{field.name}={getattr(self, field.name)}" for field in self._meta.fields]
        return ", ".join(fields)