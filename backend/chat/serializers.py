from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.CharField(source='sender.username')
    
    class Meta:
        model = Message
        fields = ['sender', 'content', 'timestamp']
