from django.db import models
from django.contrib.auth import get_user_model
# cause merge issue
User = get_user_model()

class Notification(models.Model):
    user = models.ForeignKey(
        User,  # Dynamically get the User model (useful for custom User models)
        on_delete=models.CASCADE,  # Cascade delete: delete notifications when a user is deleted
        related_name='notifications',  # Reverse relation from user to notifications
        null=False,  # Each notification must be associated with a user
    )

    # The content of the notification (this could be a simple message)
    content = models.TextField()

    # Optional URL to link to (if the notification is clickable)
    url = models.URLField(null=True, blank=True)

    # Timestamp when the notification was created
    created_at = models.DateTimeField(auto_now_add=True)

    # Timestamp when the notification was read (if applicable)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Notification for {self.user.username}: {self.content[:50]}'

    @property
    def is_read(self):
        return self.read_at is not None
