"""
ASGI config for transcendence project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
app = get_asgi_application()
from channels.routing import ProtocolTypeRouter, URLRouter
from api.authentication import JWTAuthMiddleware
from games.routing import websocket_urlpatterns
from chat import consumers
from django.urls import path
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence.settings')

application = ProtocolTypeRouter({
    "http": app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            websocket_urlpatterns + [path('ws/chat/', consumers.DirectMessageConsumer.as_asgi())]
        )
    ),
})
