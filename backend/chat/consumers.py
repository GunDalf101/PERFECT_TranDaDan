import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from api.models import UserRelationship, RelationshipType
from .models import Message, Conversation
from django.db import models
from django.core.exceptions import ObjectDoesNotExist

User = get_user_model()

class DirectMessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Store the user making the request
        self.user = self.scope['user']
        if not self.user:
            await self.close()

        # Accept the WebSocket connection
        await self.accept()

        # Add user to a group based on their user ID
        self.user_group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        # Inform that the connection is accepted
        await self.send(text_data=json.dumps({
            'message': 'Connected'
        }))

    async def disconnect(self, close_code):
        print("???")
        # Cleanup when the connection is closed
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Parse the incoming JSON data
        body = json.loads(text_data)
        username = body.get('username', None)
        content = body.get('content', None)

        # Check if the necessary fields are present
        if not username or not content or not isinstance(content, str) or not isinstance(username, str):
            await self.send_error("Missing required fields")
            return
        if username == self.user.username:
            await self.send_error("Missing required fields")
            return
        try:
            target_user = await database_sync_to_async(User.objects.get)(username=username)
        except ObjectDoesNotExist:
            await self.send_error("Target user not found")
            return

        # Check if the user is friends with the target user
        if not await self.is_friend(self.user, target_user):
            await self.send_error("Not friends")
            return

        # Get or create the conversation
        conversation = await self.get_or_create_conversation(self.user, target_user)

        # Save the message
        await self.save_message(conversation, content)

        # Send the message to the target user's WebSocket (via the group)
        await self.send_message_to_user(target_user, content)

    # Helper method to check if the users are friends
    @database_sync_to_async
    def is_friend(self, user, target_user):
        # Check if the user is friends with the target user
        try:
            relationship = UserRelationship.objects.get(
                (models.Q(first_user=user) & models.Q(second_user=target_user)) |
                (models.Q(first_user=target_user) & models.Q(second_user=user))
            )
            # Check if the relationship is FRIENDS
            if relationship.type == RelationshipType.FRIENDS.value:
                return True
            return False
        except UserRelationship.DoesNotExist:
            return False

    # Helper method to get or create the conversation between two users
    @database_sync_to_async
    def get_or_create_conversation(self, user_1, user_2):
        # Create or get the conversation between two users
        conversation, created = Conversation.objects.get_or_create(
            user_1=user_1,
            user_2=user_2
        )
        return conversation

    # Helper method to save the message to the database
    @database_sync_to_async
    def save_message(self, conversation, content):
        # Create and save the message object in the conversation
        Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content
        )

    # Helper method to send a message to the target user's WebSocket
    async def send_message_to_user(self, target_user, content):
        # Use group messaging to send the message to the target user
        target_group_name = f"user_{target_user.id}"
        await self.channel_layer.group_send(
            target_group_name,  # Send to the user's specific group
            {
                'type': 'chat_message',
                'message': content,
                'sender': self.user.username,
            }
        )

    # Send an error response
    async def send_error(self, error_message):
        await self.send(text_data=json.dumps({
            'error': error_message
        }))

    # Handle incoming messages for other types, if needed
    async def chat_message(self, event):
        # Forward the message to the connected user
        if event['sender'] != self.user.username:
            await self.send(text_data=json.dumps({
                'message': event['message'],
                'sender': event['sender'],
            }))
