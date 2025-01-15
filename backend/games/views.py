from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Match
from django.utils.timezone import now
from .models import Match
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q


User = get_user_model()

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
        return Response({'pong': pong_matches,'space': space_matches}, status=200)