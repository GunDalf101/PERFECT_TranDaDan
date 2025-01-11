# game/consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import math

class PongConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_group_name = None
        self.game_state = {}
        self.game_loop_task = None
        self.delta_time = 1 / 60  # 60 FPS
        self.player_number = None

    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.room_group_name = f'pong_{self.game_id}'
        # Add the user to the room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Initialize game state and start the game loop if not already running
        if not self.game_loop_task:
            self.initialize_game_state()
            self.game_loop_task = asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        # Remove the user from the room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        # Stop the game loop if needed
        if self.game_loop_task:
            self.game_loop_task.cancel()
            try:
                await self.game_loop_task
            except asyncio.CancelledError:
                pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        if 'type' in data and data['type'] == 'init':
            if data['isPlayer1']:
                self.player_number = 'player1'
                self.game_state['player1'] = data['username']
            else:
                self.game_state['player1'] = data['opponent']
                self.player_number = 'player2'
        if 'type' in data and data['type'] == 'mouse_move':
            self.update_paddle_position(data)
            await self.broadcast_game_state()
        elif 'type' in data and data['type'] == 'ball_position':
            self.update_ball_position(data)
            await self.broadcast_game_state()
        elif data['type'] == 'score_update':
            self.update_scores(data)
            await self.broadcast_game_state()
        
        elif data['type'] == 'game_won':
            self.handle_game_won(data)
            await self.broadcast_game_state()
        
        elif data['type'] == 'match_complete':
            await self.handle_match_complete(data)
            await self.broadcast_game_state()

    def update_scores(self, data):
        game_state = PongConsumer.shared_games[self.game_id]
        game_state['scores'] = data['scores']
        
        if 'scoring_history' not in game_state:
            game_state['scoring_history'] = []
        game_state['scoring_history'].append({
            'scorer': data['scoringPlayer'],
            'score': data['scores']
        })

    def handle_game_won(self, data):
        game_state = PongConsumer.shared_games[self.game_id]
        game_state['rounds_won'] = data['matches']
        game_state['current_game_winner'] = data['winner']
        
        game_state['scores'] = {'player1': 0, 'player2': 0}

    async def handle_match_complete(self, data):
        game_state = PongConsumer.shared_games[self.game_id]
        game_state['winner'] = self.get_user_from_player_number(data['winner'])
        game_state['final_score'] = data['finalScore']
        
        await self.update_match_record(data)
        
        game_state['scores'] = {'player1': 0, 'player2': 0}
        game_state['rounds_won'] = {'player1': 0, 'player2': 0}

    @database_sync_to_async
    def get_user_by_username(self, username):
        User = get_user_model()
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None

    def get_user_from_player_number(self, player_number):
        game_state = PongConsumer.shared_games[self.game_id]
        if player_number == 'player1':
            return game_state['player1']
        return game_state.get('player2')

    @database_sync_to_async
    def update_match_record(self, data):
        try:
            match = Match.objects.get(id=self.game_id)
            winner_username = self.get_user_from_player_number(data['winner'])
            winner_user = get_user_model().objects.get(username=winner_username)
            
            match.winner = winner_user
            match.final_score = f"{data['finalScore']['player1']}-{data['finalScore']['player2']}"
            match.score_player1 = PongConsumer.shared_games[self.game_id] ['rounds_won']['player1']
            match.score_player2 = PongConsumer.shared_games[self.game_id] ['rounds_won']['player2']
            match.forfeit = data['forfeit']
            match.status = "completed"
            match.save()
        except Match.DoesNotExist:
            print(f"Match {self.game_id} not found")
        except get_user_model().DoesNotExist:
            print(f"Winner user {winner_username} not found")

    async def game_loop(self):
        try:
            while True:
                self.update_game_state()
                # await self.broadcast_game_state()
                
                await asyncio.sleep(self.delta_time)
        except asyncio.CancelledError:
            pass

    def initialize_game_state(self):
        # print("way way ?")
        self.game_state = {
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
        # Update ball position
        # self.game_state['ball_position']['x'] += self.game_state['ball_velocity']['x'] * self.delta_time
        # self.game_state['ball_position']['y'] += self.game_state['ball_velocity']['y'] * self.delta_time

        # Example collision check
        # if self.game_state['ball_position']['y'] > 10 or self.game_state['ball_position']['y'] < -10:
        #     self.game_state['ball_velocity']['y'] *= -1
        return

    def update_paddle_position(self, data):
        # // paddleRef.current.mesh.position.z = 11 - Math.abs((2 * mouseCurrent.x));
        if self.player_number == 'player1':
            self.game_state['paddle1_position']['x'] = 5.5 * data['mouse_position']['x']
            self.game_state['paddle1_position']['z'] = 11 - abs(data['mouse_position']['x'] * 2)
            self.game_state['paddle1_position']['y'] = 5.03 + data['mouse_position']['y']
        elif self.player_number == 'player2':
            self.game_state['paddle2_position']['x'] = -5.5 * data['mouse_position']['x']
            self.game_state['paddle2_position']['z'] = -11 + abs(data['mouse_position']['x'] * 2)
            self.game_state['paddle2_position']['y'] = 5.03 + data['mouse_position']['y']

    async def broadcast_game_state(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_game_state',
                'state': self.game_state
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
    # Store queues as a dictionary with game_type as key
    matchmaking_queues = {}
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
        # Remove player from their game type queue if they're in one
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