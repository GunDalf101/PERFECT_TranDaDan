from rest_framework import serializers
from .models import ChatRoom, Message
from api.models import User
import uuid
from datetime import datetime

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    chat_room_id = serializers.UUIDField(source='room.chat_room_id', read_only=True) 

    class Meta:
        model = Message
        fields = ['message_id', 'chat_room_id', 'sender', 'sender_name', 'content', 'sent_at']  
        read_only_fields = ['message_id', 'sender', 'sent_at']

    def validate_content(self, value):
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Message content cannot be empty.")
        return value

    def create(self, validated_data):
        room = self.context.get('room')
        if not room:
            raise serializers.ValidationError("Chat room is required")
            
        sender = self.context.get('sender')
        if not sender:
            raise serializers.ValidationError("Sender is required")

        return Message.objects.create(
            room=room,
            sender=sender,
            content=validated_data['content'],
            sent_at=datetime.now()
        )

class ChatRoomSerializer(serializers.ModelSerializer):
    friend_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True 
    )
    friend_name = serializers.CharField(source='friend_id.username', read_only=True)
    user_name = serializers.CharField(source='user_id.username', read_only=True)

    class Meta:
        model = ChatRoom
        fields = ['chat_room_id', 'user_id', 'friend_id', 'user_name', 'friend_name', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user  
        friend = validated_data.get('friend_id')


        existing_room = ChatRoom.objects.filter(
            (models.Q(user_id=user, friend_id=friend) | 
             models.Q(user_id=friend, friend_id=user))
        ).first()

        if existing_room:
            return existing_room

        chat_room = ChatRoom.objects.create(
            user_id=user,
            friend_id=friend,
        )
        return chat_room