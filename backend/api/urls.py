from django.urls import path
from .views import OAuth2StartView, OAuth2CallbackView, UsersMeView, MFATOTPView, RegisterView, VerifyEmailView, LoginView, SecurityMFATOTP, RequestResetPasswordView, ResetPasswordView, UserView, UsersMeTestView, SendFriendRequest, DeleteFriendRequest, AcceptFriendRequestView

urlpatterns = [
    path('oauth2/42/', OAuth2StartView.as_view(), name='oauth2-start'),
    path('oauth2/42/callback/', OAuth2CallbackView.as_view(), name='oauth2-callback'),
    path('login/mfa/totp', MFATOTPView.as_view(), name='mfa-totp'),
    path('register', RegisterView.as_view(), name='register'),
    path('login', LoginView.as_view(), name='login'),
    path('email/verify/<str:token>', VerifyEmailView.as_view(), name='verify-email'),
    path("reset", RequestResetPasswordView.as_view(), name="reset"),
    path('reset/<str:token>', ResetPasswordView.as_view(), name='reset-token'),
    path('users/me', UsersMeView.as_view(), name='users-me'),
    path('users/meTest', UsersMeTestView.as_view(), name='users-me'),
    path('security/mfa/totp', SecurityMFATOTP.as_view(), name='security-mfa-totp'),
    path('user/<str:username>', UserView.as_view(), name='get-user'),
    path('friend/request', SendFriendRequest.as_view(), name='send-friend-request'),
    path('friend/deleterequest', DeleteFriendRequest.as_view(), name='delete-friend-request'),
    path('friend/acceptrequest', AcceptFriendRequestView.as_view(), name='accept-friend-request'),

]
