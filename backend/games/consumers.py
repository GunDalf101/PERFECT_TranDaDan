from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import math


class PongConsumer(AsyncWebsocketConsumer):
    # Shared state between all consumer instances
    shared_games = {}
    game_loops = {}
    active_connections = {}  # Track number of connections per game
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_group_name = None
        self.player_number = None
        self.game_id = None
        self.delta_time = 1/60 # 60 FPS

    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.room_group_name = f'pong_{self.game_id}'
        
        # Increment connection counter for this game
        PongConsumer.active_connections[self.game_id] = PongConsumer.active_connections.get(self.game_id, 0) + 1
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Initialize shared game state if it doesn't exist
        if self.game_id not in PongConsumer.shared_games:
            self.initialize_game_state()
            # Start game loop only once per game
            if self.game_id not in PongConsumer.game_loops:
                PongConsumer.game_loops[self.game_id] = asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        # Decrement connection counter and cleanup if last player
        if self.game_id in PongConsumer.active_connections:
            PongConsumer.active_connections[self.game_id] -= 1
            if PongConsumer.active_connections[self.game_id] <= 0:
                # Clean up game resources
                if self.game_id in PongConsumer.game_loops:
                    PongConsumer.game_loops[self.game_id].cancel()
                    try:
                        await PongConsumer.game_loops[self.game_id]
                    except asyncio.CancelledError:
                        pass
                    del PongConsumer.game_loops[self.game_id]
                
                if self.game_id in PongConsumer.shared_games:
                    del PongConsumer.shared_games[self.game_id]
                
                del PongConsumer.active_connections[self.game_id]

    def update_ball_position(self, data):
        PongConsumer.shared_games[self.game_id]['ball_position']['x'] = data['ball_position']['x']
        PongConsumer.shared_games[self.game_id]['ball_position']['y'] = data['ball_position']['y']
        PongConsumer.shared_games[self.game_id]['ball_position']['z'] = data['ball_position']['z']
        # PongConsumer.shared_games[self.game_id]['ball_velocity']['x'] = data['ball_velocity']['x']
        # PongConsumer.shared_games[self.game_id]['ball_velocity']['y'] = data['ball_velocity']['y']
        # PongConsumer.shared_games[self.game_id]['ball_velocity']['z'] = data['ball_velocity']['z']

    async def receive(self, text_data):
        data = json.loads(text_data)
        if 'type' in data and data['type'] == 'init':
            if data['isPlayer1']:
                self.player_number = 'player1'
                PongConsumer.shared_games[self.game_id]['player1'] = data['username']
            else:
                PongConsumer.shared_games[self.game_id]['player1'] = data['opponent']
                self.player_number = 'player2'
            await self.broadcast_game_state()
            
        if 'type' in data and data['type'] == 'mouse_move':
            self.update_paddle_position(data)
            await self.broadcast_game_state()
        if 'type' in data and data['type'] == 'ball_position':
            self.update_ball_position(data)
            await self.broadcast_game_state()

    async def game_loop(self):
        try:
            while True:
                self.update_game_state()
                await self.broadcast_game_state()
                await asyncio.sleep(self.delta_time)
        except asyncio.CancelledError:
            pass

    def initialize_game_state(self):
        PongConsumer.shared_games[self.game_id] = {
            'game_id': self.game_id,
            'player1': None,
            'ball_position': {
                'x': 0,
                'y': 5.0387,
                'z': -8
            },
            'ball_velocity': {
                'x': 0,
                'y': 4,
                'z': 14
            },
            'paddle1_position': {
                'x': 0,
                'y': 4.0387,
                'z': 10
            },
            'paddle2_position': {
                'x': 0,
                'y': 4.0387,
                'z': -10
            },
            'scores': {'player1': 0, 'player2': 0},
            'rounds_won': {'player1': 0, 'player2': 0},
            'winner': None
        }

    def update_game_state(self):
        pass

    def update_paddle_position(self, data):
        if self.player_number == 'player1':
            PongConsumer.shared_games[self.game_id]['paddle1_position']['x'] = 5.5 * data['mouse_position']['x']
            PongConsumer.shared_games[self.game_id]['paddle1_position']['z'] = 11 - abs(data['mouse_position']['x'] * 2)
            PongConsumer.shared_games[self.game_id]['paddle1_position']['y'] = 5.03 + data['mouse_position']['y']
        elif self.player_number == 'player2':
            PongConsumer.shared_games[self.game_id]['paddle2_position']['x'] = -5.5 * data['mouse_position']['x']
            PongConsumer.shared_games[self.game_id]['paddle2_position']['z'] = -11 + abs(data['mouse_position']['x'] * 2)
            PongConsumer.shared_games[self.game_id]['paddle2_position']['y'] = 5.03 + data['mouse_position']['y']

    async def broadcast_game_state(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_game_state',
                'state': PongConsumer.shared_games[self.game_id]
            }
        )

    async def send_game_state(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_state',
            'state': event['state']
        }))

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from .models import Match
from channels.db import sync_to_async

class MatchmakingConsumer(AsyncJsonWebsocketConsumer):
    matchmaking_queue = []
    player_to_user = {}

    async def connect(self):
        username = self.scope['query_string'].decode().split('=')[1]

        try:
            user = await sync_to_async(get_user_model().objects.get)(username=username)
        except get_user_model().DoesNotExist:
            await self.close()
            return
        
        self.scope['user'] = user

        await self.accept()

        await self.send_json({
            "status": "searching",
            "username": user.username
        })

    async def disconnect(self, code):
        if self in self.matchmaking_queue:
            self.matchmaking_queue.remove(self)

    async def receive_json(self, content):
        if content.get("type") == "find_match":
            self.matchmaking_queue.append(self)

            if len(self.matchmaking_queue) >= 2:
                player1 = self
                player2 = self.matchmaking_queue.pop(0)

                match = await sync_to_async(self.create_match)(player1, player2)

                await player1.send_json({
                    "status": "matched",
                    "opponent": player2.scope['user'].username,
                    "game_id": match.id,
                    "username": player1.scope['user'].username,
                    "player1": player1.scope['user'].username
                })
                await player2.send_json({
                    "status": "matched",
                    "opponent": player1.scope['user'].username,
                    "game_id": match.id,
                    "username": player2.scope['user'].username,
                    "player1": player1.scope['user'].username
                })

    def create_match(self, player1, player2):
        """Create a match between two players"""
        if not player1.scope.get('user') or not player2.scope.get('user'):
            raise ValueError("User data missing")
        
        player1_user = player1.scope['user']
        player2_user = player2.scope['user']

        match = Match.objects.create(
            player1=player1_user,
            player2=player2_user,
            status="ongoing"
        )
        return match
