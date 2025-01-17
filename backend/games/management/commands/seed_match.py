from django.core.management.base import BaseCommand
from games.models import Match
from django.contrib.auth import get_user_model
from random import choice, getrandbits

User = get_user_model()  # Get the user model dynamically


class Command(BaseCommand):
    help = 'Add 10 rows for each game type in the Match model'

    def handle(self, *args, **kwargs):
        first, _ = User.objects.get_or_create(username='first')
        second, _ = User.objects.get_or_create(username='second')

        game_types = ['pong', 'space-rivalry']
        for game_type in game_types:
            for i in range(10):
                match = Match.objects.create(
                    game_type=game_type,
                    player1=first,
                    player2=second,
                    score_player1=getrandbits(5),
                    score_player2=getrandbits(5),
                    winner=choice([first, second]),
                    forfeit=False,
                    status= 'completed',
                )
                self.stdout.write(self.style.SUCCESS(f'Created Match: {match.id} with game_type={game_type}'))

        self.stdout.write(self.style.SUCCESS('Successfully added 20 matches.'))
        