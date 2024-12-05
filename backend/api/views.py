from django.contrib.auth import get_user_model, authenticate
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import AccessToken
from .authentication import NoAuthenticationOnly
from django.http import HttpResponseRedirect
import requests
import random
import string
import environ
import jwt
from django.urls import reverse
from django.utils import timezone
from django.conf import settings
from .utils import unset_cookie_header, get_free_username
from .serializers import RegisterSerializer, LoginSerializer
from .tasks import send_registration_email

User = get_user_model()

env = environ.Env()
environ.Env.read_env()

class UnprotectedView(APIView):
    # ugh, currently refuse authenticated requests? empty array to accept all requests.
    authentication_classes = [NoAuthenticationOnly]

class OAuth2StartView(UnprotectedView):

    def get(self, request, *args, **kwargs):
        state = ''.join(random.choices(string.ascii_letters + string.digits, k=30))
        authorization_url = f'{env.str("42_AUTHORIZE_URL")}?client_id={env.str("CLIENT_ID")}&redirect_uri={request.build_absolute_uri(reverse("oauth2-callback"))}&response_type=code&state={state}'
        response = HttpResponseRedirect(authorization_url)
        response.set_cookie('oauth2_state', jwt.encode({"state": state}, settings.SECRET_KEY, algorithm='HS256'))
        return response


class OAuth2CallbackView(UnprotectedView):
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        code = request.GET.get('code')
        state = request.GET.get('state')

        saved_state = request.COOKIES.get('oauth2_state')
        if not saved_state or state != jwt.decode(saved_state, settings.SECRET_KEY, algorithms=['HS256'])["state"]:
            return Response({"message": "Invalid state parameter"}, status=status.HTTP_400_BAD_REQUEST, headers=unset_cookie_header("oauth2_state"))

        data = {
            'grant_type': 'authorization_code',
            'client_id': env.str("CLIENT_ID"),
            'client_secret': env.str("CLIENT_SECRET"),
            'redirect_uri': request.build_absolute_uri(reverse('oauth2-callback')),
            'code': code,
        }

        response = requests.post(env.str("42_TOKEN_URL"), data=data)
        if response.status_code != status.HTTP_200_OK:
            return Response({"message": "Failed to get access token"}, status=status.HTTP_400_BAD_REQUEST, headers=unset_cookie_header("oauth2_state"))

        access_token = response.json().get('access_token')
        if not access_token:
            return Response({"message": "No access token found"}, status=status.HTTP_400_BAD_REQUEST, headers=unset_cookie_header("oauth2_state"))

        user_info_url = env.str("42_API_ME_URL")
        headers = {'Authorization': f'Bearer {access_token}'}
        user_info_response = requests.get(user_info_url, headers=headers)

        if user_info_response.status_code != status.HTTP_200_OK:
            return Response({"message": "Failed to fetch user info from 42"}, status=status.HTTP_400_BAD_REQUEST, headers=unset_cookie_header("oauth2_state"))

        user_data = user_info_response.json()
        username = user_data.get('login')
        email = user_data.get('email')
        avatar_url = user_data.get('image', {}).get('link')

        user = User.objects.filter(email=email).first()

        message = "successfully logged in."

        if user:
            if not user.intra_user:
                # user.username = username
                # user.avatar_url = avatar_url
                user.intra_user = True
                user.email_verified = True
                user.set_password("")
                user.save()
                message = f"We have found an existing account for you, you can update your username is settings."
        else:
            user = User.objects.create_user(
                username=get_free_username(User, username),
                email=email,
                avatar_url=avatar_url,
                intra_user=True,
                online=True,
                email_verified=True
            )
            message = f"registration successful!{' your username has already been claimed, we generated a new one for you.' if user.username != username else '' }"

        access_token = AccessToken.for_user(user)
        access_token["mfa_required"] = user.mfa_enabled

        return Response({
            "access_token": str(access_token),
            "message": message,
            "user_id": user.id,
            "mfa_required": user.mfa_enabled
        }, status=status.HTTP_200_OK, headers=unset_cookie_header("oauth2_state"))


class MFATOTPView(APIView):

    def post(self, request):
        current_user = request.user 

        if not current_user.mfa_enabled:
            return Response({
                "error": "MFA is not enabled for this user."
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

        access_token = AccessToken.for_user(current_user)
        access_token["mfa_required"] = False

        return Response({
            "access_token": str(access_token),
            "user_id": current_user.id,
            "mfa_required": False
        }, status=status.HTTP_200_OK)


class RegisterView(UnprotectedView):

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            send_registration_email(user.id, schedule=timezone.now())
            return Response({
                "message": "User registered successfully, please verify your email.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "avatar_url": user.avatar_url
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class VerifyEmailView(UnprotectedView):

    def get(self, _, token):
        try:
            user = User.objects.get(email_token=token)
            user.email_token = ""
            user.email_verified = True
            user.save()
            return Response({"message": "email verified."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"message": "token not valid."}, status=status.HTTP_404_NOT_FOUND)
        
class LoginView(UnprotectedView):

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            user = authenticate(request, email=email, password=password)
            if user:
                access_token = AccessToken.for_user(user)
                access_token["mfa_required"] = user.mfa_enabled
                return Response({
                    "access_token": str(access_token),
                    "message": "logged in successfully!",
                    "user_id": user.id,
                    "mfa_required": user.mfa_enabled
                }, status=status.HTTP_200_OK)
            else:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UsersMeView(APIView):
    
    def get(self, request):
        user = request.user
        
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email
        }
        
        return Response(user_data, status=status.HTTP_200_OK)

