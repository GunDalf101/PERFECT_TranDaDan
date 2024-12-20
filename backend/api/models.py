from django.db import models
from django.core.validators import RegexValidator, EmailValidator
from django.contrib.auth.models import AbstractBaseUser
from enum import Enum

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
    avatar_url = models.CharField(max_length=255, blank=True, null=True)
    email_token = models.CharField(max_length=32, blank=True, null=True)
    online = models.BooleanField(default=False)
    mfa_enabled = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    mfa_totp_secret = models.CharField(max_length=60, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = UserManager()

    def has_usable_password(self):
        return not self.intra_connection and self.email_verified and super().has_usable_password()

    def __str__(self):
        fields = [f"{field.name}={getattr(self, field.name)}" for field in self._meta.fields]
        return ", ".join(fields)
    
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
    PENDING_FIRST_SECOND = 'pending_first_second'
    PENDING_SECOND_FIRST = 'pending_second_first'
    FRIENDS = 'friends'
    BLOCK_FIRST_SECOND = 'block_first_second'
    BLOCK_SECOND_FIRST = 'block_second_first'
    BLOCK_BOTH = 'block_both'

    @classmethod
    def choices(cls):
        return [(tag.name, tag.value) for tag in cls]

class UserRelationship(models.Model):
    user_first_id = models.ForeignKey(User, related_name='user_first', on_delete=models.CASCADE)
    user_second_id = models.ForeignKey(User, related_name='user_second', on_delete=models.CASCADE)
    
    type = models.CharField(
        max_length=20, 
        choices=RelationshipType.choices(), 
        default=RelationshipType.PENDING_FIRST_SECOND.value
    )

    class Meta:
        unique_together = ('user_first_id', 'user_second_id')
    
    def clean(self):
        if self.user_first_id == self.user_second_id:
            raise ValueError("A user cannot be in a relationship with themselves.")
        
        if self.user_first_id > self.user_second_id:
            self.user_first_id, self.user_second_id = self.user_second_id, self.user_first_id
            if self.type == RelationshipType.PENDING_FIRST_SECOND:
                self.type = RelationshipType.PENDING_SECOND_FIRST
            elif self.type == RelationshipType.PENDING_SECOND_FIRST:
                self.type = RelationshipType.PENDING_FIRST_SECOND
            elif self.type == RelationshipType.BLOCK_FIRST_SECOND:
                self.type = RelationshipType.BLOCK_SECOND_FIRST
            elif self.type == RelationshipType.BLOCK_SECOND_FIRST:
                self.type = RelationshipType.BLOCK_FIRST_SECOND

    def __str__(self):
        return f"Relationship between {self.user_first_id} and {self.user_second_id} is {self.get_type_display()}"
