# from channels.generic.websocket import AsyncWebsocketConsumer
# from channels.db import database_sync_to_async
# from django.core.exceptions import ObjectDoesNotExist
# from datetime import datetime
# import json
# import uuid

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.room_id = self.scope['url_route']['kwargs']['room_id']
#         self.room_group_name = f"chat_{self.room_id}"
#         self.user = self.scope["user"]

#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )
            
#         await self.accept()
            
#         await self.send_json({
#             'type': 'connection_established',
#             'room_id': self.room_id,
#             'message': 'Connected to chat room successfully'
#         })
            

#     async def disconnect(self, close_code):
#         if hasattr(self, 'room_group_name'):
#             await self.channel_layer.group_discard(
#                 self.room_group_name,
#                 self.channel_name
#             )
        
#         await self.update_user_status(is_online=False)

#     async def receive(self, text_data):
#         try:
#             data = json.loads(text_data)
#             message_type = data.get('type', 'chat_message')
            
#             if message_type == 'chat_message':
#                 await self.handle_chat_message(data)
#             elif message_type == 'typing_status':
#                 await self.handle_typing_status(data)
#             else:
#                 await self.send_json({
#                     'error': 'Invalid message type'
#                 })
                
#         except json.JSONDecodeError:
#             await self.send_json({
#                 'error': 'Invalid JSON format'
#             })
#         except Exception as e:
#             await self.send_json({
#                 'error': f'Error processing message: {str(e)}'
#             })

#     async def handle_chat_message(self, data):
#         message_content = data.get('message')
#         if not message_content:
#             await self.send_json({
#                 'error': 'Message content is required'
#             })
#             return

#         try:
#             message = await self.save_message(
#                 sender_id=self.user.id,
#                 content=message_content,
#                 room_id=self.room_id
#             )
            
#             await self.channel_layer.group_send(
#                 self.room_group_name,
#                 {
#                     'type': 'chat_message',
#                     'message': {
#                         'id': str(message.id),
#                         'content': message_content,
#                         'sender_id': self.user.id,
#                         'sender_name': self.user.username,
#                         'timestamp': message.timestamp.isoformat()
#                     }
#                 }
#             )
            
#         except Exception as e:
#             await self.send_json({
#                 'error': f'Error saving message: {str(e)}'
#             })

#     async def chat_message(self, event):
#         """Sends chat message to WebSocket"""
#         await self.send_json(event['message'])

#     @database_sync_to_async
#     def get_or_create_room(self):
#         """Gets or creates a chat room"""
#         try:
#             return ChatRoom.objects.get(chat_room_id=self.room_id)
#         except ChatRoom.DoesNotExist:
#             return ChatRoom.objects.create(
#                 chat_room_id=self.room_id,
#                 user_id=self.user,
#                 created_at=datetime.now()
#             )

#     @database_sync_to_async
#     def save_message(self, sender_id, content, room_id):
#         """Saves message to database using serializer"""
#         try:
#             message_data = {
#                 'room_id': room_id,
#                 'sender_id': sender_id,
#                 'content': content,
#                 'timestamp': datetime.now()
#             }
            
#             serializer = MessageSerializer(data=message_data)
#             if serializer.is_valid():
#                 return serializer.save()
#             raise ValueError(f"Invalid data: {serializer.errors}")
            
#         except Exception as e:
#             raise ValueError(f"Error saving message: {str(e)}")

#     @database_sync_to_async
#     def update_user_status(self, is_online):
#         """Updates user's online status"""
#         try:
#             self.user.is_online = is_online
#             self.user.last_seen = datetime.now()
#             self.user.save()
#         except Exception:
#             pass

# sssss


from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from datetime import datetime
import json
from .models import ChatRoom, Message
from django.db.models import Q

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        # Join user's personal notification channel
        self.notification_group = f"notifications_{self.user.id}"
        await self.channel_layer.group_add(
            self.notification_group,
            self.channel_name
        )

        # Join all user's chat rooms
        self.rooms = await self.get_user_chat_rooms()
        for room in self.rooms:
            await self.channel_layer.group_add(
                f"chat_{room.chat_room_id}",
                self.channel_name
            )

        await self.accept()
        
        # Update user's online status
        await self.update_user_status(True)
        await self.broadcast_user_status(True)

    async def disconnect(self, close_code):
        # Leave all groups and update status
        if hasattr(self, 'rooms'):
            for room in self.rooms:
                await self.channel_layer.group_discard(
                    f"chat_{room.chat_room_id}",
                    self.channel_name
                )

        if hasattr(self, 'notification_group'):
            await self.channel_layer.group_discard(
                self.notification_group,
                self.channel_name
            )

        await self.update_user_status(False)
        await self.broadcast_user_status(False)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            handlers = {
                'chat_message': self.handle_chat_message,
                'friend_request': self.handle_friend_request,
                'accept_friend': self.handle_accept_friend,
                'block_user': self.handle_block_user,
                'typing_status': self.handle_typing_status
            }

            handler = handlers.get(message_type)
            if handler:
                await handler(data)
            else:
                await self.send_json({'error': 'Invalid message type'})

        except json.JSONDecodeError:
            await self.send_json({'error': 'Invalid JSON format'})
        except Exception as e:
            await self.send_json({'error': f'Error processing message: {str(e)}'})

    async def handle_chat_message(self, data):
        room_id = data.get('room_id')
        message_content = data.get('message')

        if not message_content or not room_id:
            await self.send_json({'error': 'Missing required fields'})
            return

        # Check if user is blocked
        is_blocked = await self.check_if_blocked(room_id)
        if is_blocked:
            await self.send_json({'error': 'You cannot send messages to this user'})
            return

        try:
            message = await self.save_message(room_id, message_content)
            await self.channel_layer.group_send(
                f"chat_{room_id}",
                {
                    'type': 'chat_message',
                    'message': {
                        'id': str(message.message_id),
                        'content': message_content,
                        'sender_id': self.user.id,
                        'sender_name': self.user.username,
                        'timestamp': message.sent_at.isoformat()
                    }
                }
            )
        except Exception as e:
            await self.send_json({'error': f'Failed to send message: {str(e)}'})

    async def handle_friend_request(self, data):
        target_username = data.get('username')
        if not target_username:
            return

        try:
            # Create friend request and notify target user
            friend_request = await self.create_friend_request(target_username)
            if friend_request:
                await self.channel_layer.group_send(
                    f"notifications_{friend_request.user_second_id.id}",
                    {
                        'type': 'notification',
                        'message': {
                            'type': 'friend_request',
                            'from_user': self.user.username
                        }
                    }
                )
        except Exception as e:
            await self.send_json({'error': str(e)})

    async def handle_accept_friend(self, data):
        friend_username = data.get('username')
        if not friend_username:
            return

        try:
            # Accept friend request and create chat room
            relationship = await self.accept_friend_request(friend_username)
            if relationship:
                chat_room = await self.create_chat_room(relationship.user_first_id, relationship.user_second_id)
                
                # Notify both users and add them to the chat room
                for user_id in [relationship.user_first_id.id, relationship.user_second_id.id]:
                    await self.channel_layer.group_send(
                        f"notifications_{user_id}",
                        {
                            'type': 'notification',
                            'message': {
                                'type': 'friend_accepted',
                                'chat_room_id': str(chat_room.chat_room_id)
                            }
                        }
                    )
        except Exception as e:
            await self.send_json({'error': str(e)})

    async def handle_block_user(self, data):
        username = data.get('username')
        if not username:
            return

        try:
            await self.block_user(username)
            # Notify blocked user that they can no longer send messages
            await self.channel_layer.group_send(
                f"notifications_{username}",
                {
                    'type': 'notification',
                    'message': {
                        'type': 'user_blocked',
                        'by_user': self.user.username
                    }
                }
            )
        except Exception as e:
            await self.send_json({'error': str(e)})

    async def chat_message(self, event):
        """Handler for chat messages"""
        await self.send_json(event['message'])

    async def notification(self, event):
        """Handler for notifications"""
        await self.send_json(event['message'])

    @database_sync_to_async
    def get_user_chat_rooms(self):
        """Get all chat rooms for the current user"""
        return list(ChatRoom.objects.filter(
            Q(user_id=self.user) | Q(friend_id=self.user)
        ))

    @database_sync_to_async
    def check_if_blocked(self, room_id):
        """Check if user is blocked in the chat room"""
        try:
            room = ChatRoom.objects.get(chat_room_id=room_id)
            relationship = UserRelationship.objects.get(
                Q(user_first_id=room.user_id, user_second_id=room.friend_id) |
                Q(user_first_id=room.friend_id, user_second_id=room.user_id)
            )
            return relationship.type in [
                RelationshipType.BLOCK_BOTH,
                RelationshipType.BLOCK_FIRST_SECOND,
                RelationshipType.BLOCK_SECOND_FIRST
            ]
        except ObjectDoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, room_id, content):
        """Save a new message"""
        room = ChatRoom.objects.get(chat_room_id=room_id)
        return Message.objects.create(
            room=room,
            sender=self.user,
            content=content,
            sent_at=datetime.now()
        )

    @database_sync_to_async
    def update_user_status(self, is_online):
        """Update user's online status"""
        self.user.online = is_online
        self.user.save()

    async def broadcast_user_status(self, is_online):
        """Broadcast user's online status to all friends"""
        for room in self.rooms:
            await self.channel_layer.group_send(
                f"chat_{room.chat_room_id}",
                {
                    'type': 'user_status',
                    'message': {
                        'user_id': self.user.id,
                        'online': is_online
                    }
                }
            )


        """Handler for user status updates"""
        await self.send_json(event['message'])