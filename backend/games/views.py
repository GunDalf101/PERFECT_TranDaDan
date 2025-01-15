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
from django.db.models import Q


User = get_user_model()


class JoinQueue(APIView):

    def post(self, request, *args, **kwargs):
        player = request.user
        game_type = request.data.get('game_type', 'pong')
        if MatchmakingQueue.objects.filter(player=player).exists():
            return Response({"status": "error", "message": "Already in queue"})

        MatchmakingQueue.objects.create(player=player, game_type=game_type)
        return Response({"status": "success", "message": "Player added to matchmaking queue"})

class FindMatch(APIView):

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

    def post(self, request, *args, **kwargs):
        player = request.user
        MatchmakingQueue.objects.filter(player=player).delete()
        return Response({"status": "success"})

class GetMatch(APIView):

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

class GetUserMatch(APIView):

    def get(self, request, userid):

        matches = Match.objects.filter(
            Q(player1_id=userid) |
            Q(player2_id=userid),
            Q(status='completed')
        )
        if not matches.first():
            Response({"no matches"}, status=200)

        pong_matches = []
        space_matches = []
        for _match in matches:
            if _match.game_type == 'pong':
                pong_matches.append({
                    'id': _match.id,
                    'opponent': _match.player2.username if _match.player1.id == userid else _match.player1.username,
                    'score': "Forfeit" if _match.forfeit else f"{_match.score_player1}-{_match.score_player2}",
                    'result': 'win' if _match.winner_id == userid else 'lose'
                })
            elif _match.game_type == 'space-rivalry':
                space_matches.append({
                    'id': _match.id,
                    'opponent': _match.player2.username if _match.player1.id == userid else _match.player1.username,
                    'score': "Forfeit" if _match.forfeit else f"{_match.score_player1}-{_match.score_player2}",
                    'result': 'win' if _match.winner_id == userid else 'lose'
                })
        return Response({'pong': pong_matches[::-1],'space': space_matches[::-1]}, status=200)

class CancelMatch(APIView):

    def post(self, request, *args, **kwargs):
        game_id = request.data.get('game_id')
        game = Match.objects.get(id=game_id)
        game.delete()
        return Response({"status": "success"})

class SubmitGameResult(APIView):

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
