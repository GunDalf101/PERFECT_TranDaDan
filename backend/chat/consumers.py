import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from api.models import UserRelationship, RelationshipType
from .models import Message, Conversation
from django.db import models
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q

User = get_user_model()

class DirectMessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        print(self.user)
        if not self.user:
            await self.close()
            return
        await self.accept()

        # Set up user group and cache key
        self.user_group_name = f"user_{self.user.id}"
        self.cache_key = f"user_status_{self.user.id}"

        # Increment user's connection count in cache
        try:
            current_count = cache.incr(self.cache_key, 1)
        except ValueError:
            current_count = cache.set(self.cache_key, 1)
        print(f"type>> {current_count}")
        # cache.set(self.cache_key, current_count + 1)
        # print(f"upon connect: {cache.get(self.cache_key, 0)}")

        # Add user to a group based on their user ID
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        # Inform that the connection is accepted
        await self.send(text_data=json.dumps({
            'message': 'Connected'
        }))

        # Notify friends of the user's status change (user is online)
        if current_count == 1:
            await self.notify_friends_of_status_change(self.user, True)

        # Check for online status of all friends (scan Redis keys)
        await self.scan_and_notify_friends_of_status(self.user)

    async def disconnect(self, close_code):
        if hasattr(self, "cache_key"):
            current_count = cache.decr(self.cache_key, 1)
            print(f"a11>> {current_count}")
            # If the user's counter is zero, notify friends that the user is offline
            if cache.get(self.cache_key, 0) == 0:
                await self.notify_friends_of_status_change(self.user, False)

        if hasattr(self, "user_group_name"):
            # Cleanup when the connection is closed
            if self.user_group_name:
                await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def receive(self, text_data):
        # Parse the incoming JSON data
        try:
            body = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error("Missing required fields")
            return
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
    def get_or_create_conversation(self, first_user, second_user):
        # Create or get the conversation between two users
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

    async def notify_friends_of_status_change(self, user, is_online):
        """Notify the user's friends about their online/offline status."""
        friends = await self.get_user_friends(user)

        for friend in friends:
            friend_group_name = f"user_{friend.id}"
            await self.channel_layer.group_send(
                friend_group_name,
                {
                    'type': 'friend_status_change',
                    'username': user.username,
                    'is_online': is_online,
                }
            )

    async def scan_and_notify_friends_of_status(self, user):
        """Scan Redis for all users' online status and notify friends."""
        # Scan Redis keys for the "user_status_" prefix
        keys = cache.keys("user_status_*")  # This will return all keys matching the pattern

        # Check each key to see if it's a friend of the user
        for key in keys:
            user_id = key.split("_")[-1]  # Extract the user ID from the key
            try:
                target_user = await database_sync_to_async(User.objects.get)(id=user_id)
                if await self.is_friend(user, target_user):  # Check if they are friends
                    is_online = cache.get(key) > 0  # Check if the user is online
                    await self.send(text_data=json.dumps({
                        'type': 'friend_status_change',
                        'username': target_user.username,
                        'is_online': is_online,
                    }))
            except ObjectDoesNotExist:
                continue  # Ignore if the user doesn't exist

    # Helper method to get the user's friends
    @database_sync_to_async
    def get_user_friends(self, user):
        friends = UserRelationship.objects.filter(
            models.Q(first_user=user) | models.Q(second_user=user),
            type=RelationshipType.FRIENDS.value
        )
        friends_list = [rel.first_user if rel.second_user == user else rel.second_user for rel in friends]
        return friends_list

    async def friend_status_change(self, event):
        """Handle notifications when a friend's status changes."""
        await self.send(text_data=json.dumps({
            'type': 'friend_status_change',
            'username': event['username'],
            'is_online': event['is_online'],
        }))
