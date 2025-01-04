from django.db import models
from django.db.models import Q
from django.db.models.signals import pre_save
from django.dispatch import receiver
from api.models import User, UserRelationship, RelationshipType

class Conversation(models.Model):
    user_1 = models.ForeignKey(User, related_name='conversations_user_1', on_delete=models.CASCADE)
    user_2 = models.ForeignKey(User, related_name='conversations_user_2', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Conversation between {self.user_1.username} and {self.user_2.username}"

    class Meta:
        unique_together = ['user_1', 'user_2']

    def clean(self):
        if self.user_1.id > self.user_2.id:
            self.user_1, self.user_2 = self.user_2, self.user_1

    @staticmethod
    def are_users_friends(user_1, user_2):
        relationship = UserRelationship.objects.filter(
            Q(first_user=user_1, second_user=user_2, type=RelationshipType.FRIENDS.value) |
            Q(first_user=user_2, second_user=user_1, type=RelationshipType.FRIENDS.value)
        ).exists()

        return relationship

@receiver(pre_save, sender=Conversation)
def check_users_are_friends(sender, instance, **kwargs):
    if not instance.are_users_friends(instance.user_1, instance.user_2):
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
        return Conversation.are_users_friends(sender, conversation.user_1) or Conversation.are_users_friends(sender, conversation.user_2)


@receiver(pre_save, sender=Message)
def check_if_sender_is_friends(sender, instance, **kwargs):
    if not instance.is_sender_friends_with_recipient(instance.sender, instance.conversation):
        raise Exception("You must be friends with the recipient to send a message.")
