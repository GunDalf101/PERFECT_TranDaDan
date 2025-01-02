from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
# from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import ChatRoom, Message, User
from .serializers import ChatRoomSerializer, MessageSerializer
from django.db import models 

class ChatRoomViewSet(viewsets.ModelViewSet):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer

    def get_queryset(self):
        return ChatRoom.objects.filter(
            models.Q(user_id=self.request.user) |
            models.Q(friend_id=self.request.user)
        )

    @action(detail=False, methods=['post'])
    def create_room(self, request):
        user_id = int(request.data.get('user_id'))
        friend_id = int(request.data.get('friend_id'))
        
        user = get_object_or_404(User, id=user_id)
        friend = get_object_or_404(User, id=friend_id)

        existing_room = ChatRoom.objects.filter(
            (models.Q(user_id=user) & models.Q(friend_id=friend)) |
            (models.Q(user_id=friend) & models.Q(friend_id=user))
        ).first()

        if existing_room:
            serializer = self.get_serializer(existing_room)
            return Response(serializer.data)
            
        chat_room = ChatRoom.objects.create(
            user_id=user,
            friend_id=friend
        )
        
        serializer = self.get_serializer(chat_room)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
        

class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    # http_method_names = ['get', 'post', 'head']

    # @action(detail=False, methods=['post'])
    # def create_message(self, request):
    #     room_id = request.data.get('room_id')
    #     content = request.data.get('content')
        
    #     if not all([room_id, content]):
    #         return Response(
    #             {'error': 'room_id and content are required'},
    #             status=status.HTTP_400_BAD_REQUEST
    #         )
            
    #     try:
    #         room = ChatRoom.objects.get(chat_room_id=room_id)
    #     except ChatRoom.DoesNotExist:
    #         return Response(
    #             {'error': 'Chat room not found'},
    #             status=status.HTTP_404_NOT_FOUND
    #         )
            
    #     serializer = MessageSerializer(
    #         data={'content': content},
    #         context={
    #             'room': room,
    #             'sender': request.user
    #         }
    #     )
        
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response(serializer.data, status=status.HTTP_201_CREATED)
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def conversation(self):
        room_id = self.request.query_params.get('room_id')
        if room_id:
            return Message.objects.filter(room__chat_room_id=room_id).order_by('sent_at')
        return Message.objects.none()
    