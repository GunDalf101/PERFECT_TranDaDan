from django.urls import path
from .views import (
    OAuth2StartView, OAuth2CallbackView, UsersMeView,
    MFATOTPView, RegisterView, VerifyEmailView, LoginView,
    SecurityMFATOTP, RequestResetPasswordView, ResetPasswordView,
    UserView, UsersMeAvatarView, SendFriendRequest, DeleteFriendRequest,
    AcceptFriendRequestView, BlockUser, UnfriendView, FriendsView, UserRankingsViewSet
    )
from .views import UserSearchView

urlpatterns = [
    path('oauth2/42/', OAuth2StartView.as_view(), name='oauth2-start'),
    path('oauth2/42/callback/', OAuth2CallbackView.as_view(), name='oauth2-callback'),
    path('login/mfa/totp', MFATOTPView.as_view(), name='mfa-totp'),
    path('security/mfa/totp', SecurityMFATOTP.as_view(), name='security-mfa-totp'),
    path('register', RegisterView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login'),
    path('email/verify/<str:token>', VerifyEmailView.as_view(), name='verify-email'),
    path("reset", RequestResetPasswordView.as_view(), name="reset"),
    path('reset/<str:token>', ResetPasswordView.as_view(), name='reset-token'),
    path('users/me', UsersMeView.as_view(), name='users-me'),
    path('users/me/avatar', UsersMeAvatarView.as_view(), name='users-me-avatar'),
    path('user/<str:username>', UserView.as_view(), name='get-user'),
    path('friend/request', SendFriendRequest.as_view(), name='send-friend-request'),
    path('friend/deleterequest', DeleteFriendRequest.as_view(), name='delete-friend-request'),
    path('friend/unfriendrequest', UnfriendView.as_view(), name='unfrien-friend'),
    path('friend/acceptrequest/<str:username>', AcceptFriendRequestView.as_view(), name='accept-friend-request'),
    path('blockuser', BlockUser.as_view(), name='block-user'),
    path('friends', FriendsView.as_view(), name='friends'),
    path('search/', UserSearchView.as_view(), name='user-search'),
    path('leaderboard', UserRankingsViewSet.as_view({'get': 'get'}), name='leaderboard'),
]
