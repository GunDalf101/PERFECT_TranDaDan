from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import sync_to_async
from django.contrib.auth import get_user_model
from ..models import Match
from ..utils import PlayersManager

class MatchmakingConsumer(AsyncJsonWebsocketConsumer):
    # Store queues as a dictionary with game_type as key
    matchmaking_queues = {}
    player_to_user = {}

    # @database_sync_to_async
    # def get_user_ingame(self, user):
    #     return user.ingame

    async def connect(self):
        username = self.scope['query_string'].decode().split('=')[1]

        try:
            user = await sync_to_async(get_user_model().objects.get)(username=username)
        except get_user_model().DoesNotExist: 
            await self.close()
            return

        self.scope['user'] = user
        for queue in self.matchmaking_queues.values():
            for player in queue:
                if player.scope['user'] == user:
                    await self.close()
                    return

        # ingame_status = await self.get_user_ingame(user)
        print(f"players: {PlayersManager._players}")
        ingame_status = PlayersManager.player_exists(user.username)
        if ingame_status:
            await self.close()
            print(f"jhh ingame_status: {ingame_status}")
            return

        await self.accept()

        await self.send_json({
            "status": "searching",
            "username": user.username
        })

    async def disconnect(self, code):
        for queue in self.matchmaking_queues.values():
            if self in queue:
                queue.remove(self)
                break

    async def receive_json(self, content):
        if content.get("type") == "find_match":
            game_type = content.get("game_type")
            if not game_type:
                await self.send_json({
                    "status": "error",
                    "message": "Game type is required"
                })
                return

            if game_type not in self.matchmaking_queues:
                self.matchmaking_queues[game_type] = []

            self.matchmaking_queues[game_type].append(self)

            if len(self.matchmaking_queues[game_type]) >= 2:

                player1 = self.matchmaking_queues[game_type].pop(0)
                player2 = self.matchmaking_queues[game_type].pop(0)

                match = await sync_to_async(self.create_match)(
                    player1,
                    player2,
                    game_type
                )

                await player1.send_json({
                    "status": "matched",
                    "opponent": player2.scope['user'].username,
                    "game_id": match.id,
                    "username": player1.scope['user'].username,
                    "player1": player1.scope['user'].username,
                    "game_type": game_type
                })
                await player2.send_json({
                    "status": "matched",
                    "opponent": player1.scope['user'].username,
                    "game_id": match.id,
                    "username": player2.scope['user'].username,
                    "player1": player1.scope['user'].username,
                    "game_type": game_type
                })

    def create_match(self, player1, player2, game_type):
        """Create a match between two players for a specific game type"""
        if not player1.scope.get('user') or not player2.scope.get('user'):
            raise ValueError("User data missing")

        player1_user = player1.scope['user']
        player2_user = player2.scope['user']

        match = Match.objects.create(
            player1=player1_user,
            player2=player2_user,
            game_type=game_type,
            status="ongoing"
        )
        return match