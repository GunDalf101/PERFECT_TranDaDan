from django.contrib.auth.models import BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        """
        Create and return a regular user with an email, username, and password.
        """
        if not email:
            raise ValueError('The email field must be set')
        user = self.model(email=email, username=username, **extra_fields)
        print(f"{user}")
        if not user.intra_user:
            if not password:
                raise ValueError('The password field must be set')
            user.set_password(password)
        user.save(using=self._db)
        return user
