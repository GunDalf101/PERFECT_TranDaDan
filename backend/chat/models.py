from django.db import models
from uuid import uuid4
from api.models import User

class ChatRoom(models.Model):
    chat_room_id = models.UUIDField(
        primary_key=True, 
        default=uuid4,  # Automatically generate a unique ID
        editable=False  # Prevent manual editing
    )
    # chat_room = models.CharField(max_length=24)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_rooms')
    friend_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_chat_rooms')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ChatRoom({self.chat_room_id}) - {self.user_id.username} & {self.friend_id.username}"

class Message(models.Model):
    message_id = models.UUIDField(
        primary_key=True, 
        default=uuid4,  # Automatically generate a unique ID
        editable=False  # Prevent manual editing
    )
    # message = models.CharField(primary_key=True)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    sent_at = models.DateTimeField()

    def __str__(self):
        return f"{self.message_id} {self.sender.username} "