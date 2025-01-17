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
                    'result': 'win' if _match.winner_id == userid else 'lose',
                    'end_date': _match.ended_at.strftime("%m/%d/%Y")
                })
            elif _match.game_type == 'space-rivalry':
                space_matches.append({
                    'id': _match.id,
                    'opponent': _match.player2.username if _match.player1.id == userid else _match.player1.username,
                    'score': "Forfeit" if _match.forfeit else f"{_match.score_player1}-{_match.score_player2}",
                    'result': 'win' if _match.winner_id == userid else 'lose',
                    'end_date': _match.ended_at.strftime("%m/%d/%Y")
                })
        return Response({'pong': pong_matches[::-1],'space': space_matches[::-1]}, status=200)

from django.utils.timezone import now, timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import now, timedelta
from django.db.models import Q

class GetUserDash(APIView):
    def get(self, request, userid):
        today = now().date()
        last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]

        wins = [0] * 7
        loses = [0] * 7

        for index, day in enumerate(last_7_days):
            print(day)
            
            # Count wins for the day
            wins[index] = Match.objects.filter(
                winner_id=userid,
                started_at__date=day,
                status='completed'
            ).count()

            # Count losses for the day
            loses[index] = Match.objects.filter(
                Q(player1_id=userid) | Q(player2_id=userid),
                ~Q(winner_id=userid),
                started_at__date=day,
                status='completed'
            ).count()

        pong_t_win = Match.objects.filter(
                winner_id=userid,
                status='completed',
                game_type='pong'
            ).count()

        pong_t_lose = Match.objects.filter(
                Q(player1_id=userid) | Q(player2_id=userid),
                ~Q(winner_id=userid),
                status='completed',
                game_type='pong'
            ).count()

        space_t_win = Match.objects.filter(
                winner_id=userid,
                status='completed',
                game_type='space-rivalry'
            ).count()

        space_t_lose = Match.objects.filter(
                Q(player1_id=userid) | Q(player2_id=userid),
                ~Q(winner_id=userid),
                status='completed',
                game_type='space-rivalry'
            ).count()

        response_data = {
            "days": [day.strftime('%A') for day in last_7_days],
            "wins": wins,
            "loses": loses,
            "pong":{
                "t_win": pong_t_win,
                "t_lose": pong_t_lose
            },
            "space":{
                "t_win": space_t_win,
                "t_lose": space_t_lose
            }
        }


        return Response(response_data, status=status.HTTP_200_OK)




from rest_framework import viewsets
from rest_framework.response import Response
from django.db.models import Count, Avg, F, Q, Max, Min, StdDev
from django.db.models.functions import TruncDate, TruncHour, ExtractHour, Abs  # Added Abs import
from django.utils import timezone
from datetime import timedelta

class MatchStatsViewSet(viewsets.ViewSet):
    def get(self, request):
        completed_matches = Match.objects.filter(status='completed')
        
        today = timezone.now().date()
        last_week = today - timedelta(days=7)
        last_month = today - timedelta(days=30)

        total_matches = Match.objects.count()
        active_matches = Match.objects.filter(status='active').count()
        completed_count = completed_matches.count()
        forfeit_count = completed_matches.filter(forfeit=True).count()
        
        game_distribution = (Match.objects.values('game_type')
                           .annotate(count=Count('id'))
                           .order_by('-count'))

        duration_stats = completed_matches.exclude(ended_at__isnull=True).aggregate(
            avg_duration=Avg(F('ended_at') - F('started_at')),
            max_duration=Max(F('ended_at') - F('started_at')),
            min_duration=Min(F('ended_at') - F('started_at'))
        )

        score_stats = completed_matches.aggregate(
            avg_score_diff=Avg(F('score_player1') - F('score_player2')),
            max_combined_score=Max(F('score_player1') + F('score_player2')),
            avg_combined_score=Avg(F('score_player1') + F('score_player2')),
            score_std_dev=StdDev(F('score_player1') + F('score_player2'))
        )

        hourly_activity = (completed_matches
                          .annotate(hour=ExtractHour('started_at'))
                          .values('hour')
                          .annotate(count=Count('id'))
                          .order_by('hour'))

        daily_matches = (completed_matches
                        .filter(started_at__gte=last_month)
                        .annotate(date=TruncDate('started_at'))
                        .values('date')
                        .annotate(count=Count('id'))
                        .order_by('date'))

        game_performance = {}
        for game in game_distribution:
            game_type = game['game_type']
            game_matches = completed_matches.filter(game_type=game_type)
            game_performance[game_type] = {
                'total_matches': game['count'],
                'avg_duration': game_matches.exclude(ended_at__isnull=True)
                    .aggregate(avg=Avg(F('ended_at') - F('started_at')))['avg'],
                'avg_score': game_matches.aggregate(
                    avg=Avg(F('score_player1') + F('score_player2')))['avg'],
                'forfeit_rate': (game_matches.filter(forfeit=True).count() / 
                               game['count'] * 100 if game['count'] > 0 else 0)
            }

        player_metrics = {
            'total_players': (Match.objects
                            .values('player1')
                            .distinct()
                            .count() +
                            Match.objects
                            .values('player2')
                            .distinct()
                            .count()),
            'active_players': (Match.objects
                             .filter(started_at__gte=last_week)
                             .values('player1')
                             .distinct()
                             .count() +
                             Match.objects
                             .filter(started_at__gte=last_week)
                             .values('player2')
                             .distinct()
                             .count()),
            'top_players': (Match.objects
                          .values('winner__username')
                          .annotate(wins=Count('winner'))
                          .order_by('-wins')[:10])
        }

        skill_distribution = completed_matches.annotate(
            score_diff=Abs(F('score_player1') - F('score_player2'))
        ).aggregate(
            avg_score_diff=Avg('score_diff'),
            close_matches=Count('id', filter=Q(score_diff__lte=5))
        )

        return Response({
            'overview': {
                'total_matches': total_matches,
                'active_matches': active_matches,
                'completed_matches': completed_count,
                'forfeit_rate': (forfeit_count / completed_count * 100 
                               if completed_count > 0 else 0)
            },
            'game_distribution': list(game_distribution),
            'duration_stats': duration_stats,
            'score_stats': score_stats,
            'hourly_activity': list(hourly_activity),
            'daily_trend': list(daily_matches),
            'game_performance': game_performance,
            'player_metrics': player_metrics,
            'matchmaking_quality': skill_distribution,
            'recent_matches': (completed_matches
                            .order_by('-ended_at')
                            .values('id', 'game_type', 'player1__username',
                                  'player2__username', 'score_player1', 
                                  'score_player2', 'winner__username')[:10])
        })