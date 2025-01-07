from django.db import models
from django.db.models import Q
from django.db.models.signals import pre_save
from django.dispatch import receiver
from api.models import User, UserRelationship, RelationshipType


class Conversation(models.Model):
    first_user = models.ForeignKey(User, related_name='first_user_conversations', on_delete=models.CASCADE)
    second_user = models.ForeignKey(User, related_name='second_user_conversations', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conversation between {self.first_user.username} and {self.second_user.username}"

    class Meta:
        unique_together = ['first_user', 'second_user']

    def clean(self):
        if self.first_user.id > self.second_user.id:
            self.first_user, self.second_user = self.second_user, self.first_user

    def save(self, *args, **kwargs):
        print("AAAAA")
        self.clean()
        super().save(*args, **kwargs)

    @staticmethod
    def are_users_friends(first_user, second_user):
        relationship = UserRelationship.objects.filter(
            Q(first_user=first_user, second_user=second_user, type=RelationshipType.FRIENDS.value) |
            Q(first_user=second_user, second_user=first_user, type=RelationshipType.FRIENDS.value)
        ).exists()

        return relationship

@receiver(pre_save, sender=Conversation)
def check_users_are_friends(sender, instance, **kwargs):
    if not instance.are_users_friends(instance.first_user, instance.second_user):
        raise Exception("The users must be friends to start a conversation.")

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, related_name='messages', on_delete=models.CASCADE)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.sender.username} at {self.timestamp}"

    class Meta:
        ordering = ['timestamp']

    @staticmethod
    def is_sender_friends_with_recipient(sender, conversation):
        return Conversation.are_users_friends(sender, conversation.first_user) or Conversation.are_users_friends(sender, conversation.second_user)


@receiver(pre_save, sender=Message)
def check_if_sender_is_friends(sender, instance, **kwargs):
    if not instance.is_sender_friends_with_recipient(instance.sender, instance.conversation):
        raise Exception("You must be friends with the recipient to send a message.")
