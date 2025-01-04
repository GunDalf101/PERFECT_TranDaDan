from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Match
from django.utils.timezone import now
from .models import MatchmakingQueue, Match
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


class JoinQueue(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        player = request.user
        game_type = request.data.get('game_type', 'pong')
        if MatchmakingQueue.objects.filter(player=player).exists():
            return Response({"status": "error", "message": "Already in queue"})
        
        MatchmakingQueue.objects.create(player=player, game_type=game_type)
        return Response({"status": "success", "message": "Player added to matchmaking queue"})

class FindMatch(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        queue = MatchmakingQueue.objects.order_by('joined_at')[:2]
        if len(queue) < 2:
            return Response({"status": "error", "message": "Not enough players in queue"})
        
        if queue[0].game_type != queue[1].game_type:
            return Response({"status": "error", "message": "Not enough players in queue"})

        player1, player2 = queue
        game = Match.objects.create(player1=player1.player, player2=player2.player, status='ongoing')
        print(request.user)

        # player1.delete()
        # player2.delete()

        return Response({
            "status": "success",
            "game_id": game.id,
            "player1": game.player1.username,
            "player2": game.player2.username
        })

class LeaveQueue(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        player = request.user
        MatchmakingQueue.objects.filter(player=player).delete()
        return Response({"status": "success"})

class GetMatch(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        game_id = request.query_params.get('game_id')
        try:
            game = Match.objects.get(id=game_id)
            return Response({
                "status": "success",
                "game_id": game.id,
                "player1": game.player1.username,
                "player2": game.player2.username,
                "status": game.status,
                "score_player1": game.score_player1,
                "score_player2": game.score_player2,
                "winner": game.winner.username if game.winner else None
            })
        except Match.DoesNotExist:
            return Response({"status": "error", "message": "Game not found"}, status=status.HTTP_404_NOT_FOUND)

class CancelMatch(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        game_id = request.data.get('game_id')
        game = Match.objects.get(id=game_id)
        game.delete()
        return Response({"status": "success"})

class SubmitGameResult(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        game_id = request.data.get('game_id')
        game_type = request.data.get('game_type')
        winner = request.data.get('winner')
        score_player1 = request.data.get('score_player1', 0)
        score_player2 = request.data.get('score_player2', 0)

        game = Match.objects.get(id=game_id)
        game.winner = User.objects.get(username=winner)
        game.score_player1 = score_player1
        game.score_player2 = score_player2
        game.status = 'completed'
        game.ended_at = now()
        game.save()

        return Response({"status": "success"})