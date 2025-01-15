from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone
from .models import Notification
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from api.models import UserRelationship, RelationshipType
from django.db.models import Q
User = get_user_model()
import json
import threading

class UserConnectionManager:
    # Shared dictionary for counting connections
    _connections = {}
    _lock = threading.Lock()

    @classmethod
    def increment_connection(cls, username: str):
        """Increment the connection count for a given username."""
        with cls._lock:
            if username in cls._connections:
                cls._connections[username] += 1
            else:
                cls._connections[username] = 1
            return cls._connections[username]

    @classmethod
    def decrement_connection(cls, username: str):
        """Decrement the connection count for a given username."""
        with cls._lock:
            if username in cls._connections and cls._connections[username] > 0:
                cls._connections[username] -= 1
            return cls._connections[username]

    @classmethod
    def get_connection_count(cls, username: str) -> int:
        """Get the current connection count for a given username."""
        with cls._lock:
            return cls._connections.get(username, 0)

    @classmethod
    def get_all_connections(cls):
        """Return the current state of the connections dictionary."""
        with cls._lock:
            return cls._connections.copy()

class NotificationConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.user = self.scope.get('user', None)

        if self.user is None:
            await self.close()
            return

        await self.accept()
        if UserConnectionManager.increment_connection(self.user.username) == 1:
            #print(f"first connect: {self.user.username}")
            await self.notify_friends_of_my_status_change(self.user, True)
        else:
            pass
            #print(f"not first conn: {self.user.username} >> {UserConnectionManager.get_connection_count(self.user.username)}")
        self.group_name = f"notifs_user_{self.user.username}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.send_notifications()
        await self.send_friends_list()
        await self.scan_for_online_friends(self.user)

    async def disconnect(self, close_code):
        #print("WTdisconnectdisconnectsdisconnectFfFFFFF")
        if self.user and UserConnectionManager.decrement_connection(self.user.username) < 1:
            #print(f"first disco: {self.user.username}")
            await self.notify_friends_of_my_status_change(self.user, False)
        else:
            pass
            #print(f"noot first disco: {self.user.username}")
        if hasattr(self, "user_group_name"):
            if self.user_group_name:
                await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        type = content.get("type")
        if type == "mark_as_read":
            notification_id = content.get("notification_id")
            await self.mark_as_read(notification_id)
        elif type == "relationship_update":
            await self.handle_relationship_update(content)

    async def send_notifications(self):
        notifications = await self.get_unread_notifications()

        await self.send_json({
            'msgtype': 'notification',
            'notifications': notifications
        })

    async def send_friends_list(self):
        friends = await self.get_user_friends(self.user)
        friends = list(map(lambda friend: friend.username, friends))
        print(friends)
        await self.send_json({
            'msgtype': 'friends',
            'friends': friends
        })

    async def send_new_notification(self, event):
        await self.send_json({
            'msgtype': 'notification',
            'notifications': [event['notification']]
        })

    @database_sync_to_async
    def get_unread_notifications(self):
        notifications = Notification.objects.filter(
            user=self.user, read_at__isnull=True).order_by('-created_at').values('id', 'content', 'url', 'created_at')
        return [
            {
                'id': notification['id'],
                'content': notification['content'],
                'url': notification['url'],
                'created_at': notification['created_at'].isoformat()
            }
            for notification in notifications
        ]

    @database_sync_to_async
    def mark_as_read(self, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=self.user)
            notification.read_at = timezone.now()
            notification.save()
        except Notification.DoesNotExist:
            pass

    async def handle_relationship_update(self, content):
        action = content.get("action")
        username = content.get("username")

        if action == "sent_friend_request":
            notif = await self.create_new_notification(username, f"You have a new friend request from @{self.user.username}.", url=f"/user/{self.user.username}")
            await self.channel_layer.group_send(
                f"notifs_user_{username}",
                {
                    'type': 'send_new_notification',
                    'notification': {
                        'id': notif.id,
                        'content': notif.content,
                        'url': notif.url,
                        'created_at': notif.created_at.isoformat()
                    }

                }
            )
        await self.channel_layer.group_send(
            f"notifs_user_{self.user.username}",
            {
                'type': 'dispatch_relationship_update',
                'msgtype': 'relationship_update',
                'action': action,
                'username': username,
                'sender': self.channel_name
            }
        )
        await self.channel_layer.group_send(
            f"notifs_user_{username}",
            {
                'type': 'dispatch_relationship_update',
                'msgtype': 'relationship_update',
                'action': action,
                'username': self.user.username,
                # 'sender': self.channel_name
            }
        )

    async def dispatch_relationship_update(self, event):
        # if "type" in event:
        #     del event['type']
        # else:
        #     #print(f"WTFFF: {event}")
        #     raise Exception
        # if event.get("msgtype") == 'self_relationship_update':
        #     if self.channel_name != event.get("sender"):
        #         if "sender" in event:
        #             del event['sender']
        #         await self.send_json(event)
        # else:
        if self.channel_name != event.get("sender"):
            if "sender" in event:
                del event['sender']
            await self.send_json(event)

    @database_sync_to_async
    def get_user_by_username(self, username):
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def create_new_notification(self, username, content, url):
        user = User.objects.get(username=username)
        notif = Notification.objects.create(content=content, url=url, user=user)
        return notif

    async def notify_friends_of_my_status_change(self, user, is_online):
        """Notify the user's friends about their online/offline status."""
        friends = await self.get_user_friends(user)

        for friend in friends:
            #print(f"f > {friend.username}")
            friend_group_name = f"notifs_user_{friend.username}"
            await self.channel_layer.group_send(
                friend_group_name,
                {
                    'type': 'friend_status_change',
                    'username': user.username,
                    'is_online': is_online,
                }
            )

    @database_sync_to_async
    def get_user_friends(self, user):
        friends = UserRelationship.objects.filter(
            Q(first_user=user) | Q(second_user=user),
            type=RelationshipType.FRIENDS.value
        )
        friends_list = [rel.first_user if rel.second_user == user else rel.second_user for rel in friends]
        return friends_list

    async def scan_for_online_friends(self, user):
        friends = await self.get_user_friends(user)
        for friend in friends:
            #print(f"scan_for_online_friends> >> {friend.username}")
            is_online = True if UserConnectionManager.get_connection_count(friend.username) > 0 else False
            if is_online:
                await self.send(text_data=json.dumps({
                    'msgtype': 'friend_status_change',
                    'username': friend.username,
                    'is_online': is_online,
                }))

    @database_sync_to_async
    def is_friend(self, user, target_user):
        try:
            relationship = UserRelationship.objects.get(
                (Q(first_user=user) & Q(second_user=target_user)) |
                (Q(first_user=target_user) & Q(second_user=user))
            )
            if relationship.type == RelationshipType.FRIENDS.value:
                return True
            return False
        except UserRelationship.DoesNotExist:
            return False

    async def friend_status_change(self, event):
        #print(f"recevied smtg [{self.user.username}]: {event}")
        """Handle notifications when a friend's status changes."""
        await self.send(text_data=json.dumps({
            'msgtype': 'friend_status_change',
            'username': event['username'],
            'is_online': event['is_online'],
        }))
