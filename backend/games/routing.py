# routing.py
from django.urls import path, re_path
from .consumers.pong_consumer import PongConsumer
from .consumers.matchmaking_consumer import MatchmakingConsumer
from .consumers.space_rivalry_consumer import SpaceRivalryConsumer
from .consumers.invite_consumer import InviteConsumer
from .consumers.classic_pong_consumer import ClassicPongConsumer

websocket_urlpatterns = [
    re_path(r'ws/pong/(?P<game_id>\w+)/$', PongConsumer.as_asgi()),
    re_path(r'ws/matchmaking/$', MatchmakingConsumer.as_asgi()),
    re_path(r'ws/space-rivalry/(?P<game_id>\w+)/$', SpaceRivalryConsumer.as_asgi()),
    re_path(r'ws/invites/$', InviteConsumer.as_asgi()),
    re_path(r'ws/classic-pong/(?P<game_id>\w+)/$', ClassicPongConsumer.as_asgi()),
]
