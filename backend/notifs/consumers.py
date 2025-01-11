from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.utils import timezone
from .models import Notification
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()

class NotificationConsumer(AsyncJsonWebsocketConsumer):

    async def connect(self):
        self.user = self.scope.get('user', None)

        if self.user is None:
            await self.close()
            return

        self.group_name = f"notifs_user_{self.user.username}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_notifications()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        type = content.get("type")
        print(f"????: {type}")

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
            f"notifs_user_{username}",
            {
                'type': 'dispatch_relationship_update',
                'msgtype': 'relationship_update',
                'action': action,
                'username': self.user.username
            }
        )

    async def dispatch_relationship_update(self, event):
        del event['type']
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
