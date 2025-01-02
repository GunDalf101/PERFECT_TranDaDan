from django.urls import path
from . import consumer 

websocket_urlpatterns = [
    path(r'ws/chat/(?P<room_id>[^/]+)/$',consumer.ChatConsumer.as_asgi())
]