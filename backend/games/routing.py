# routing.py
from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/game/<int:game_id>/', consumers.PongConsumer.as_asgi()),
    path('ws/matchmaking/', consumers.MatchmakingConsumer.as_asgi()),
    path('ws/space-rivalry/<int:game_id>/', consumers.SpaceRivalryConsumer.as_asgi()),

]
