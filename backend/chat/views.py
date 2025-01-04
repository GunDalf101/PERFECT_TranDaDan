from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Conversation, Message
from .serializers import MessageSerializer
from django.db.models import Q

User = get_user_model()

class MessagePagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 100

class ChatView(APIView):
    pagination_class = MessagePagination

    def get(self, request, username):
        try:
            recipient = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if request.user == recipient:
            return Response({"error": "You cannot chat with yourself."}, status=status.HTTP_400_BAD_REQUEST)

        conversation = Conversation.objects.filter(
            Q(user_1=request.user, user_2=recipient) |
            Q(user_1=recipient, user_2=request.user)
        ).first()

        if not conversation:
            try:
                Conversation.objects.create(
                    user_1=request.user,
                    user_2=recipient
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        messages = Message.objects.filter(conversation=conversation).order_by('-timestamp')

        paginator = self.pagination_class()
        result_page = paginator.paginate_queryset(messages, request)
        serializer = MessageSerializer(result_page, many=True, context={'request': request})

        return paginator.get_paginated_response(serializer.data)
