from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import random
import math
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from ..models import Match

class ClassicPongConsumer(AsyncWebsocketConsumer):
    shared_games = {}
    game_loops = {}
    active_connections = {}
    
    GAME_WIDTH = 800
    GAME_HEIGHT = 400
    PADDLE_WIDTH = 15
    PADDLE_HEIGHT = 80
    BALL_SIZE = 10
    PADDLE_SPEED = 8
    INITIAL_BALL_SPEED = 7
    MAX_BALL_SPEED = 15
    BALL_SPEEDUP = 0.2
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_group_name = None
        self.game_id = None
        self.username = None
        self.player_num = None
        self.delta_time = 1/60

    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.user = self.scope.get('user', None)
        
        if not self.user:
            await self.close()
            return
            
        self.username = self.user.username
        self.room_group_name = f'pong_{self.game_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        if self.game_id not in self.shared_games:
            self.initialize_game_state()
            self.game_loops[self.game_id] = asyncio.create_task(self.game_loop())

        self.active_connections[self.game_id] = self.active_connections.get(self.game_id, 0) + 1

    def initialize_game_state(self):
        """Initialize the game state"""
        self.shared_games[self.game_id] = {
            'gameStarted': False,
            'gameOver': False,
            'player1': None,
            'player2': None,
            'paddle1Y': (self.GAME_HEIGHT - self.PADDLE_HEIGHT) / 2,
            'paddle2Y': (self.GAME_HEIGHT - self.PADDLE_HEIGHT) / 2,
            'ballX': self.GAME_WIDTH / 2,
            'ballY': self.GAME_HEIGHT / 2,
            'ballSpeedX': self.INITIAL_BALL_SPEED * (1 if random.random() > 0.5 else -1),
            'ballSpeedY': self.INITIAL_BALL_SPEED * (random.random() * 2 - 1),
            'score1': 0,
            'score2': 0,
            'lastUpdate': 0
        }

    async def receive(self, text_data):
        data = json.loads(text_data)
        game_state = self.shared_games[self.game_id]

        if data['type'] == 'init':
            if data['isPlayer1']:
                self.player_num = 'player1'
                game_state['player1'] = data['username']
                game_state['player2'] = data['opponent']
            else:
                self.player_num = 'player2'
                game_state['player1'] = data['opponent']
                game_state['player2'] = data['username']

            if game_state['player1'] and game_state['player2']:
                game_state['gameStarted'] = True

        elif data['type'] == 'player_input':
            self.handle_player_input(data['input'])

        await self.broadcast_game_state()

    def handle_player_input(self, input_type):
        game_state = self.shared_games[self.game_id]
        paddle_key = 'paddle1Y' if self.player_num == 'player1' else 'paddle2Y'

        if input_type == 'up':
            game_state[paddle_key] = max(
                0,
                game_state[paddle_key] - self.PADDLE_SPEED
            )
        elif input_type == 'down':
            game_state[paddle_key] = min(
                self.GAME_HEIGHT - self.PADDLE_HEIGHT,
                game_state[paddle_key] + self.PADDLE_SPEED
            )

    async def game_loop(self):
        try:
            while True:
                game_state = self.shared_games[self.game_id]
                
                if game_state['gameStarted'] and not game_state['gameOver']:
                    self.update_ball_position()
                    self.check_collisions()
                    await self.check_scoring()
                    await self.broadcast_game_state()
                
                await asyncio.sleep(self.delta_time)
                
        except asyncio.CancelledError:
            pass

    def check_collisions(self):
        game_state = self.shared_games[self.game_id]
        
        ball_left = game_state['ballX'] - self.BALL_SIZE/2
        ball_right = game_state['ballX'] + self.BALL_SIZE/2
        ball_top = game_state['ballY'] - self.BALL_SIZE/2
        ball_bottom = game_state['ballY'] + self.BALL_SIZE/2

        left_paddle_x = 50
        if (ball_left <= left_paddle_x + self.PADDLE_WIDTH and
            ball_right >= left_paddle_x and
            ball_top <= game_state['paddle1Y'] + self.PADDLE_HEIGHT and
            ball_bottom >= game_state['paddle1Y'] and
            game_state['ballSpeedX'] < 0):

            game_state['ballX'] = left_paddle_x + self.PADDLE_WIDTH + self.BALL_SIZE/2
            self.handle_paddle_hit(game_state, game_state['paddle1Y'], True)

        right_paddle_x = self.GAME_WIDTH - 50 - self.PADDLE_WIDTH
        if (ball_right >= right_paddle_x and
            ball_left <= right_paddle_x + self.PADDLE_WIDTH and
            ball_top <= game_state['paddle2Y'] + self.PADDLE_HEIGHT and
            ball_bottom >= game_state['paddle2Y'] and
            game_state['ballSpeedX'] > 0):

            game_state['ballX'] = right_paddle_x - self.BALL_SIZE/2
            self.handle_paddle_hit(game_state, game_state['paddle2Y'], False)

    def handle_paddle_hit(self, game_state, paddle_y, is_left_paddle):
        relative_hit = (game_state['ballY'] - (paddle_y + self.PADDLE_HEIGHT/2)) / (self.PADDLE_HEIGHT/2)
        relative_hit = max(-1, min(1, relative_hit))
        
        max_angle = 5 * math.pi / 12
        
        angle = relative_hit * max_angle
        
        current_speed = math.sqrt(game_state['ballSpeedX']**2 + game_state['ballSpeedY']**2)
        
        new_speed = min(current_speed + self.BALL_SPEEDUP, self.MAX_BALL_SPEED)
        
        new_speed *= 1 + random.uniform(-0.1, 0.1)

        direction = 1 if is_left_paddle else -1

        game_state['ballSpeedX'] = direction * abs(new_speed * math.cos(angle))

        y_direction = 1 if game_state['ballSpeedY'] > 0 else -1
        game_state['ballSpeedY'] = y_direction * abs(new_speed * math.sin(angle))

        game_state['ballSpeedY'] *= 1 + random.uniform(-0.1, 0.1)

    def update_ball_position(self):
        game_state = self.shared_games[self.game_id]
        
        next_x = game_state['ballX'] + game_state['ballSpeedX']
        next_y = game_state['ballY'] + game_state['ballSpeedY']
        
        if next_y - self.BALL_SIZE/2 <= 0:
            next_y = self.BALL_SIZE/2
            game_state['ballSpeedY'] = abs(game_state['ballSpeedY'])
        elif next_y + self.BALL_SIZE/2 >= self.GAME_HEIGHT:
            next_y = self.GAME_HEIGHT - self.BALL_SIZE/2
            game_state['ballSpeedY'] = -abs(game_state['ballSpeedY'])
        
        game_state['ballX'] = next_x
        game_state['ballY'] = next_y

    async def check_scoring(self):
        game_state = self.shared_games[self.game_id]
        
        scored = False
        if game_state['ballX'] <= 0:
            game_state['score2'] += 1
            scored = True
        elif game_state['ballX'] >= self.GAME_WIDTH:
            game_state['score1'] += 1
            scored = True
            
        if scored:
            if game_state['score1'] >= 11 or game_state['score2'] >= 11:
                winner = game_state['player1'] if game_state['score1'] > game_state['score2'] else game_state['player2']
                game_state['gameOver'] = True
                await self.handle_game_end(winner)
            else:
                self.reset_ball()

    def reset_ball(self):
        game_state = self.shared_games[self.game_id]
        game_state['ballX'] = self.GAME_WIDTH / 2
        game_state['ballY'] = self.GAME_HEIGHT / 2
        game_state['ballSpeedX'] = self.INITIAL_BALL_SPEED * (1 if random.random() > 0.5 else -1)
        game_state['ballSpeedY'] = self.INITIAL_BALL_SPEED * (random.random() * 2 - 1)

    async def handle_game_end(self, winner):
        """Handle game end"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_ended',
                'winner': winner
            }
        )
        await self.save_match_result()

    @database_sync_to_async
    def save_match_result(self):
        game_state = self.shared_games[self.game_id]
        Match.objects.create(
            player1=get_user_model().objects.get(username=game_state['player1']),
            player2=get_user_model().objects.get(username=game_state['player2']),
            score1=game_state['score1'],
            score2=game_state['score2'],
            winner=get_user_model().objects.get(username=(
                game_state['player1'] if game_state['score1'] > game_state['score2'] 
                else game_state['player2']
            ))
        )

    async def broadcast_game_state(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_state',
                'state': self.shared_games[self.game_id]
            }
        )

    async def game_state(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_state',
            'state': event['state']
        }))

    async def game_ended(self, event):
        """Send game ended event to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'game_ended',
            'winner': event['winner']
        }))

    async def disconnect(self, close_code):
        if self.game_id in self.active_connections:
            self.active_connections[self.game_id] -= 1
            
            if self.active_connections[self.game_id] == 0:
                if self.game_id in self.game_loops:
                    self.game_loops[self.game_id].cancel()
                    del self.game_loops[self.game_id]
                if self.game_id in self.shared_games:
                    del self.shared_games[self.game_id]
            else:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'player_disconnected',
                        'player': self.username
                    }
                )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def player_disconnected(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_disconnected',
            'player': event['player']
        }))