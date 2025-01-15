from django.urls import path
from .views import GetUserMatch

urlpatterns = [
    path('usermatches/<int:userid>', GetUserMatch.as_view(), name='get_user_match'),
]