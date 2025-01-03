from django.urls import path
from .views import JoinQueue, FindMatch, SubmitGameResult, LeaveQueue, CancelMatch, GetMatch

urlpatterns = [
    path('matchmaking/join/', JoinQueue.as_view(), name='join_queue'),
    path('matchmaking/find/', FindMatch.as_view(), name='find_match'),
    path('matchmaking/leave/', LeaveQueue.as_view(), name='leave_queue'),
    path('game/result/', SubmitGameResult.as_view(), name='submit_game_result'),
    path('game/cancel/', CancelMatch.as_view(), name='cancel_match'),
    path('game/get/', GetMatch.as_view(), name='get_match'),
]
