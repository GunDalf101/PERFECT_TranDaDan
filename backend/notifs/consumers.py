# consumers.py (inside your notifications app)

import json
from channels.generic.websocket import JsonWebsocketConsumer
from django.utils import timezone
from .models import Notification

class NotificationConsumer(JsonWebsocketConsumer):

    def connect(self):
        # Get the user from the scope (user should be authenticated)
        self.user = self.scope.get('user', None)

        # Reject connection if user is not authenticated
        if self.user is None:
            self.close()
            return

        # Create a unique group for the user
        self.group_name = f"user_{self.user.id}"

        # Add the user to the group
        self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        # Accept the WebSocket connection
        self.accept()

        # Send the user's notifications upon connection
        self.send_notifications()

    def disconnect(self, close_code):
        # Remove the user from the group when they disconnect
        self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    def receive_json(self, content):
        # Handle incoming JSON messages (e.g., to mark a notification as read)
        action = content.get("action")

        if action == "mark_as_read":
            notification_id = content.get("notification_id")
            self.mark_as_read(notification_id)

    def send_notifications(self):
        # Query unread notifications for the user, ordered by created_at (latest first)
        notifications = Notification.objects.filter(
            user=self.user,
            read_at__isnull=True
        ).order_by('-created_at').values('id', 'content', 'url', 'created_at')

        # Send notifications as JSON to the WebSocket
        notifications = [
            {
                'id': notification['id'],
                'content': notification['content'],
                'url': notification['url'],
                'created_at': notification['created_at'].isoformat()
            }
            for notification in notifications
        ]

        # Send notifications as JSON to the WebSocket
        self.send_json({
            'notifications': notifications
        })

    def mark_as_read(self, notification_id):
        try:
            # Get the notification and mark it as read
            notification = Notification.objects.get(id=notification_id, user=self.user)
            notification.read_at = timezone.now()
            notification.save()

            # Send confirmation to the client that the notification was marked as read
            self.send_json({
                'status': 'Notification marked as read',
                'notification_id': notification_id
            })
        except Notification.DoesNotExist:
            # If the notification doesn't exist, send an error
            self.send_json({
                'status': 'Notification not found',
                'notification_id': notification_id
            })
