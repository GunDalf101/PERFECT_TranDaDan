from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import random
import math
import time
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from ..models import Match
from ..utils import PlayersManager

class ClassicPongConsumer(AsyncWebsocketConsumer):
    shared_games = {}
    game_loops = {}
    active_connections = {}
    connection_timestamps = {}
    disconnection_cleanup_tasks = {}
    
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
        self.reconnection_grace_period = 5
        self.cleanup_ref = False
        self.user = None

    @database_sync_to_async
    def check_match_status(self):
        try:
            match = Match.objects.get(id=self.game_id)
            return match.status == "completed"
        except Match.DoesNotExist:
            return False

    @database_sync_to_async
    def update_match_record(self, game_state):
        try:
            match = Match.objects.get(id=self.game_id)
            winner_username = game_state['winner']
            winner_user = get_user_model().objects.get(username=winner_username)
            
            match.winner = winner_user
            match.score_player1 = game_state['score1']
            match.score_player2 = game_state['score2']
            match.forfeit = game_state.get('forfeit', False)
            match.ended_at = timezone.now()
            match.status = "completed"
            match.save()
        except Exception as e:
            print(f"Error updating match record: {e}")

    async def connect(self):
        self.user = self.scope.get('user', None)
        
        if not self.user:
            await self.close()
            return

        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.username = self.user.username

        PlayersManager.add_player(self.username)

        if not self.game_id or not self.username:
            await self.close()
            return

        self.room_group_name = f'pong_{self.game_id}'

        is_completed = await self.check_match_status()
        if is_completed:
            await self.close()
            return

        self.connection_timestamps[self.channel_name] = time.time()

        if self.game_id in self.disconnection_cleanup_tasks:
            self.disconnection_cleanup_tasks[self.game_id].cancel()
            del self.disconnection_cleanup_tasks[self.game_id]

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        if self.game_id not in self.shared_games:
            self.initialize_game_state()
            if self.game_id not in self.game_loops:
                self.game_loops[self.game_id] = asyncio.create_task(self.game_loop())

        if self.active_connections.get(self.game_id, 0) > 0:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_reconnected',
                    'message': 'Opponent has reconnected'
                }
            )

        self.active_connections[self.game_id] = self.active_connections.get(self.game_id, 0) + 1

    async def disconnect(self, close_code):
        if not hasattr(self, 'game_id'):
            return

        disconnect_time = time.time()
        connection_time = self.connection_timestamps.get(self.channel_name, disconnect_time)
        connection_duration = disconnect_time - connection_time
        
        self.connection_timestamps.pop(self.channel_name, None)
        
        PlayersManager.remove_player(self.username)
        
        if connection_duration < 1:
            await self.handle_unstable_connection()
            return
            
        cleanup_task = asyncio.create_task(
            self.delayed_cleanup(self.game_id, self.player_num)
        )
        self.disconnection_cleanup_tasks[self.game_id] = cleanup_task
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_disconnected',
                'player': self.player_num,
                'message': 'Opponent disconnected. Waiting for reconnection...'
            }
        )
        
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        
        if self.game_id in self.active_connections:
            self.active_connections[self.game_id] -= 1

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            game_state = self.shared_games[self.game_id]

            if data['type'] == 'init':
                await self.handle_init(data, game_state)
            elif data['type'] == 'player_input':
                self.handle_player_input(data['input'])

            await self.broadcast_game_state()

        except Exception as e:
            print(f"Error in receive: {e}")
            await self.send_error("An error occurred processing your input")

    async def handle_init(self, data, game_state):
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

    def initialize_game_state(self):
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
            'lastUpdate': time.time(),
            'winner': None,
            'forfeit': False,
            'combo1': 0,
            'combo2': 0
        }

    async def game_loop(self):
        try:
            while True:
                if self.game_id in self.shared_games:
                    game_state = self.shared_games[self.game_id]
                    current_time = time.time()
                    dt = current_time - game_state['lastUpdate']
                    
                    if game_state['gameStarted'] and not game_state['gameOver']:
                        self.update_game_state(dt)
                        game_state['lastUpdate'] = current_time
                        await self.check_scoring()
                        await self.broadcast_game_state()
                
                await asyncio.sleep(self.delta_time)
                
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error in game loop: {e}")

    def update_game_state(self, dt):
        game_state = self.shared_games[self.game_id]
        self.update_ball_position()
        self.check_collisions()

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
            game_state['combo1'] += 1
            game_state['combo2'] = 0

        right_paddle_x = self.GAME_WIDTH - 50 - self.PADDLE_WIDTH
        if (ball_right >= right_paddle_x and
            ball_left <= right_paddle_x + self.PADDLE_WIDTH and
            ball_top <= game_state['paddle2Y'] + self.PADDLE_HEIGHT and
            ball_bottom >= game_state['paddle2Y'] and
            game_state['ballSpeedX'] > 0):

            game_state['ballX'] = right_paddle_x - self.BALL_SIZE/2
            self.handle_paddle_hit(game_state, game_state['paddle2Y'], False)
            game_state['combo2'] += 1
            game_state['combo1'] = 0

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

    async def check_scoring(self):
        game_state = self.shared_games[self.game_id]
        
        scored = False
        if game_state['ballX'] <= 0:
            game_state['score2'] += 1
            game_state['combo2'] = 0
            scored = True
        elif game_state['ballX'] >= self.GAME_WIDTH:
            game_state['score1'] += 1
            game_state['combo1'] = 0
            scored = True
            
        if scored:
            if game_state['score1'] >= 11 or game_state['score2'] >= 11:
                winner = game_state['player1'] if game_state['score1'] > game_state['score2'] else game_state['player2']
                game_state['winner'] = winner
                game_state['gameOver'] = True
                await self.update_match_record(game_state)
                await self.broadcast_game_end(winner)
            else:
                self.reset_ball()

    def reset_ball(self):
        game_state = self.shared_games[self.game_id]
        game_state['ballX'] = self.GAME_WIDTH / 2
        game_state['ballY'] = self.GAME_HEIGHT / 2
        game_state['ballSpeedX'] = self.INITIAL_BALL_SPEED * (1 if random.random() > 0.5 else -1)
        game_state['ballSpeedY'] = self.INITIAL_BALL_SPEED * (random.random() * 2 - 1)

    async def delayed_cleanup(self, game_id, player_number):
        try:
            await asyncio.sleep(self.reconnection_grace_period)
            
            if game_id in self.shared_games:
                game_state = self.shared_games[game_id]
                
                if not game_state.get('winner'):
                    disconnected_player = player_number
                    winning_player = 'player2' if disconnected_player == 'player1' else 'player1'
                    
                    winner_username = game_state[winning_player]
                    game_state['winner'] = winner_username
                    game_state['gameOver'] = True
                    game_state['forfeit'] = True
                    
                    winner_score = max(game_state['score1'], game_state['score2'])
                    game_state['score1'] = winner_score if winning_player == 'player1' else 0
                    game_state['score2'] = winner_score if winning_player == 'player2' else 0
                    
                    await self.update_match_record(game_state)
                    
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_ended_by_forfeit',
                            'state': game_state,
                            'message': f'Game ended due to player disconnection. {winner_username} wins by forfeit.'
                        }
                    )
                
                if game_id in self.game_loops:
                    self.game_loops[game_id].cancel()
                    del self.game_loops[game_id]
                    
                if game_id in self.shared_games:
                    del self.shared_games[game_id]
                    
                if game_id in self.active_connections:
                    del self.active_connections[game_id]
                    
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error in delayed cleanup for game {game_id}: {e}")

    async def broadcast_game_state(self):
        if self.game_id in self.shared_games:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state_update',
                    'state': self.shared_games[self.game_id]
                }
            )

    async def broadcast_game_end(self, winner):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_ended',
                'winner': winner,
                'state': self.shared_games[self.game_id]
            }
        )

    async def handle_unstable_connection(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'connection_warning',
                'message': 'Unstable connection detected. Please check your internet connection.'
            }
        )

    async def send_error(self, message):
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))

    async def game_state_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_state',
            'state': event['state']
        }))

    async def game_ended(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_ended',
            'winner': event['winner'],
            'state': event['state']
        }))

    async def game_ended_by_forfeit(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_ended_by_forfeit',
            'state': event['state'],
            'message': event['message']
        }))

    async def connection_warning(self, event):
        await self.send(text_data=json.dumps({
            'type': 'connection_warning',
            'message': event['message']
        }))

    async def player_disconnected(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_disconnected',
            'message': event['message']
        }))

    async def player_reconnected(self, event):
        await self.send(text_data=json.dumps({
            'type': 'player_reconnected',
            'message': event['message']
        }))