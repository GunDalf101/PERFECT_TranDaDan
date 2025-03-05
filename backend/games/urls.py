from django.urls import path
from .views import GetUserMatch, MatchStatsViewSet, GetUserDash

urlpatterns = [
    path('usermatches/<int:userid>', GetUserMatch.as_view(), name='get_user_match'),
    path('userdash/<int:userid>', GetUserDash.as_view(), name='get_user_match'),
    path('stats', MatchStatsViewSet.as_view(), name='match-stats'),
]
