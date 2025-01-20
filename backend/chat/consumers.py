import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from api.models import UserRelationship, RelationshipType
from .models import Message, Conversation
from django.db import models
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q

User = get_user_model()

class DirectMessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if not self.user:
            await self.close()
            return
        await self.accept()

        self.user_group_name = f"user_{self.user.id}"

        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await self.send(text_data=json.dumps({
            'message': 'Connected'
        }))

    async def disconnect(self, close_code):
        if hasattr(self, "user_group_name"):
            if self.user_group_name:
                await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            try:
                body = json.loads(text_data)
            except json.JSONDecodeError:
                await self.send_error("Missing required fields")
                return
            username = body.get('username', None)
            content = body.get('content', None)
            if not username or not content or not isinstance(content, str) or not isinstance(username, str):
                await self.send_error("Missing required fields")
                return
            if username == self.user.username:
                await self.send(text_data=json.dumps({
                    'error': "not friends",
                    'username': username
                }))
                return
            if len(content) > 500:
                await self.send(text_data=json.dumps({
                    'error': "too much texto",
                    'username': username
                }))
                return
            try:
                target_user = await database_sync_to_async(User.objects.get)(username=username)
            except ObjectDoesNotExist:
                await self.send_error("Target user not found")
                return

            if not await self.is_friend(self.user, target_user):
                await self.send(text_data=json.dumps({
                    'error': "not friends",
                    'username': username
                }))
                return

            conversation = await self.get_or_create_conversation(self.user, target_user)
            await self.save_message(conversation, content)
            await self.send_message_to_user(target_user, content)
        except Exception:
            pass

    @database_sync_to_async
    def is_friend(self, user, target_user):
        try:
            relationship = UserRelationship.objects.get(
                (models.Q(first_user=user) & models.Q(second_user=target_user)) |
                (models.Q(first_user=target_user) & models.Q(second_user=user))
            )
            if relationship.type == RelationshipType.FRIENDS.value:
                return True
            return False
        except UserRelationship.DoesNotExist:
            return False

    @database_sync_to_async
    def get_or_create_conversation(self, first_user, second_user):
        conversation = Conversation.objects.filter(
            Q(first_user=first_user, second_user=second_user) |
            Q(first_user=second_user, second_user=first_user)
        ).first()
        if not conversation:
            conversation = Conversation.objects.create(
                first_user=first_user,
                second_user=second_user
            )
            return conversation
        return conversation

    @database_sync_to_async
    def save_message(self, conversation, content):
        Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content
        )

    async def send_message_to_user(self, target_user, content):
        target_group_name = f"user_{target_user.id}"
        await self.channel_layer.group_send(
            target_group_name,
            {
                'type': 'chat_message',
                'message': content,
                'sender': self.user.username,
            }
        )

    async def send_error(self, error_message):
        await self.send(text_data=json.dumps({
            'error': error_message
        }))

    async def chat_message(self, event):
        if event['sender'] != self.user.username:
            await self.send(text_data=json.dumps({
                'message': event['message'],
                'sender': event['sender'],
            }))


