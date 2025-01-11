from django.db import models
from django.conf import settings

class Match(models.Model):
    id = models.AutoField(primary_key=True)
    game_type = models.CharField(max_length=15, default='pong')
    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='matches_player1',
    )
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='matches_player2',
    )
    score_player1 = models.IntegerField(default=0)
    score_player2 = models.IntegerField(default=0)
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        related_name='matches_won'
    )
    
    status = models.CharField(max_length=10, default='pending')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True)
    

    def __str__(self):
        return f"{self.player1} vs {self.player2}"
    
class MatchmakingQueue(models.Model):
    id = models.AutoField(primary_key=True)
    game_type = models.CharField(max_length=15, default='pong')
    player = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        related_name='matchmaking_queue',
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user} in matchmaking queue"