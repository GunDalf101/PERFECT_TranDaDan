from django.db import models
from django.core.validators import RegexValidator, EmailValidator
from django.contrib.auth.models import AbstractBaseUser
from enum import Enum
from django.db.models.signals import pre_save
from django.dispatch import receiver
import pyotp

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
        null=True,
        blank=True
    )
    # tournament_alias = models.CharField(
    #     max_length=50,
    #     unique=True,
    #     validators=[RegexValidator(regex=r'^[a-zA-Z0-9]*$', message="tournament alias must contain only alphanumeric characters")]
    # )
    avatar_url = models.CharField(max_length=255, blank=True, null=True)
    email_token = models.CharField(max_length=32, blank=True, null=True)
    online = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    mfa_totp_secret = models.CharField(max_length=60, blank=True, null=True)
    ingame = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = UserManager()

    def has_usable_password(self):
        return not self.intra_connection and self.email_verified and super().has_usable_password()

    def __str__(self):
        fields = [f"{field.name}={getattr(self, field.name)}" for field in self._meta.fields]
        return ", ".join(fields)

@receiver(pre_save, sender=User)
def set_mfa_totp_secret(sender, instance, **kwargs):
    if not instance.mfa_totp_secret:
        instance.mfa_totp_secret = pyotp.random_base32()

class IntraConnection(models.Model):
    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='intra_connection',
        null=True
    )
    uid = models.IntegerField(unique=True)
    email = models.EmailField(max_length=255, unique=True)
    avatar_url = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"IntraConnection(uid={self.uid}, username={self.username})"

class RelationshipType(Enum):
    PENDING_FIRST_SECOND = 1
    PENDING_SECOND_FIRST = 2
    FRIENDS = 3
    BLOCK_FIRST_SECOND = 4
    BLOCK_SECOND_FIRST = 5
    BLOCK_BOTH = 6

    @classmethod
    def choices(cls):
        return [(tag.name, tag.value) for tag in cls]

class UserRelationship(models.Model):
    first_user = models.ForeignKey(User, related_name='user_first', on_delete=models.CASCADE)
    second_user = models.ForeignKey(User, related_name='user_second', on_delete=models.CASCADE)

    type = models.IntegerField(unique=False)

    class Meta:
        unique_together = ('first_user', 'second_user')

    def clean(self):
        if self.first_user == self.second_user:
            raise ValueError("A user cannot be in a relationship with themselves.")

        if self.first_user.id > self.second_user.id:
            self.first_user, self.second_user = self.second_user, self.first_user
            if self.type == RelationshipType.PENDING_FIRST_SECOND.value:
                self.type = RelationshipType.PENDING_SECOND_FIRST.value
            elif self.type == RelationshipType.PENDING_SECOND_FIRST.value:
                self.type = RelationshipType.PENDING_FIRST_SECOND.value
            elif self.type == RelationshipType.BLOCK_FIRST_SECOND.value:
                self.type = RelationshipType.BLOCK_SECOND_FIRST.value
            elif self.type == RelationshipType.BLOCK_SECOND_FIRST.value:
                self.type = RelationshipType.BLOCK_FIRST_SECOND.value

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Relationship between {self.first_user} and {self.second_user} is {self.get_type_display()}"
