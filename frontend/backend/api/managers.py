from django.contrib.auth.models import BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, username, intra_user=False, password=None, **extra_fields):
        """
        Create and return a regular user with an email, username, and password.
        """
        if not intra_user:
            if not email:
                raise ValueError('The email field must be set')
            if not password:
                raise ValueError('The password field must be set')
        user = self.model(email=email, username=username, **extra_fields)
        print(f"{user}")
        user.set_password(password)
        user.save(using=self._db)
        return user
