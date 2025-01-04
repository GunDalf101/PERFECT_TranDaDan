from django.urls import path
from .views import ChatView

urlpatterns = [
    path('<str:username>', ChatView.as_view(), name='chat'),
]
