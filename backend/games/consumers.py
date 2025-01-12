from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import math
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from .models import Match
from channels.db import database_sync_to_async, sync_to_async
import time


class PongConsumer(AsyncWebsocketConsumer):
    shared_games = {}
    game_loops = {}
    active_connections = {}
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_group_name = None
        self.player_number = None
        self.game_id = None
        self.delta_time = 1/60

    connection_timestamps = {}
    reconnection_grace_period = 5
    disconnection_cleanup_tasks = {}

    @database_sync_to_async
    def check_match_status(self):
        try:
            match = Match.objects.get(id=self.game_id)
            return match.status == "completed"
        except Match.DoesNotExist:
            return False


    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.room_group_name = f'pong_{self.game_id}'

        is_completed = await self.check_match_status()
        if is_completed:
            await self.close(code=4000)
            return

        PongConsumer.connection_timestamps[self.channel_name] = time.time()

        if self.game_id in PongConsumer.disconnection_cleanup_tasks:
            PongConsumer.disconnection_cleanup_tasks[self.game_id].cancel()
            del PongConsumer.disconnection_cleanup_tasks[self.game_id]
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        if self.game_id not in PongConsumer.shared_games:
            self.initialize_game_state()
            if self.game_id not in PongConsumer.game_loops:
                PongConsumer.game_loops[self.game_id] = asyncio.create_task(self.game_loop())

        if PongConsumer.active_connections.get(self.game_id, 0) > 0:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'player_reconnected',
                    'message': 'Opponent has reconnected'
                }
            )

        PongConsumer.active_connections[self.game_id] = PongConsumer.active_connections.get(self.game_id, 0) + 1

    async def disconnect(self, close_code):
        disconnect_time = time.time()
        connection_time = PongConsumer.connection_timestamps.get(self.channel_name, disconnect_time)
        connection_duration = disconnect_time - connection_time

        PongConsumer.connection_timestamps.pop(self.channel_name, None)

        if connection_duration < 1:
            await self.handle_unstable_connection()
            return

        cleanup_task = asyncio.create_task(
            self.delayed_cleanup(self.game_id, self.player_number)
        )
        PongConsumer.disconnection_cleanup_tasks[self.game_id] = cleanup_task

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_disconnected',
                'player': self.player_number,
                'message': 'Opponent disconnected. Waiting for reconnection...'
            }
        )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def delayed_cleanup(self, game_id, player_number):
        try:
            await asyncio.sleep(self.reconnection_grace_period)

            if game_id in PongConsumer.shared_games:
                game_state = PongConsumer.shared_games[game_id]

                if not game_state.get('winner'):
                    disconnected_player = player_number
                    winning_player = 'player2' if disconnected_player == 'player1' else 'player1'
                    
                    game_state['winner'] = game_state[winning_player]
                    game_state['final_score'] = {
                        'player1': 3 if winning_player == 'player1' else 0,
                        'player2': 3 if winning_player == 'player2' else 0
                    }
                    game_state['disconnect_forfeit'] = True
                    
                    await self.update_match_record({
                        'winner': winning_player,
                        'finalScore': game_state['final_score'],
                        'forfeit': True
                    })

                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_ended_by_forfeit',
                            'state': game_state,
                            'message': f'Game ended due to player disconnection. {game_state[winning_player]} wins by forfeit.'
                        }
                    )
                
                if game_id in PongConsumer.game_loops:
                    PongConsumer.game_loops[game_id].cancel()
                    del PongConsumer.game_loops[game_id]
                
                if game_id in PongConsumer.shared_games:
                    del PongConsumer.shared_games[game_id]
                
                if game_id in PongConsumer.active_connections:
                    del PongConsumer.active_connections[game_id]
        
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error in delayed cleanup for game {game_id}: {e}")

    async def handle_unstable_connection(self):
        """Handle very brief connections that might indicate technical issues"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'connection_warning',
                'message': 'Unstable connection detected. Please check your internet connection.'
            }
        )

    async def player_disconnected(self, event):
        """Handle player disconnection message"""
        await self.send(text_data=json.dumps({
            'type': 'player_disconnected',
            'player': event['player'],
            'message': event['message']
        }))

    async def player_reconnected(self, event):
        """Handle player reconnection message"""
        await self.send(text_data=json.dumps({
            'type': 'player_reconnected',
            'message': event['message']
        }))

    async def connection_warning(self, event):
        """Handle connection warning message"""
        await self.send(text_data=json.dumps({
            'type': 'connection_warning',
            'message': event['message']
        }))

    async def game_ended_by_forfeit(self, event):
        """Handle game ended by forfeit message"""
        await self.send(text_data=json.dumps({
            'type': 'game_ended_by_forfeit',
            'state': event['state'],
            'message': event['message']
        }))


    def update_ball_position(self, data):
        PongConsumer.shared_games[self.game_id]['ball_position']['x'] = data['ball_position']['x']
        PongConsumer.shared_games[self.game_id]['ball_position']['y'] = data['ball_position']['y']
        PongConsumer.shared_games[self.game_id]['ball_position']['z'] = data['ball_position']['z']

    async def receive(self, text_data):
        data = json.loads(text_data)
        if 'type' in data and data['type'] == 'init':
            if data['isPlayer1']:
                self.player_number = 'player1'
                PongConsumer.shared_games[self.game_id]['player1'] = data['username']
                PongConsumer.shared_games[self.game_id]['player2'] = data['opponent']
            else:
                PongConsumer.shared_games[self.game_id]['player1'] = data['opponent']
                PongConsumer.shared_games[self.game_id]['player2'] = data['username']
                self.player_number = 'player2'
            await self.broadcast_game_state()
            
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
                await self.broadcast_game_state()
                await asyncio.sleep(self.delta_time)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error in game loop for {self.game_id}: {e}")
            raise

    def initialize_game_state(self):
        PongConsumer.shared_games[self.game_id] = {
            'game_id': self.game_id,
            'player1': None,
            'player2': None,
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
            PongConsumer.shared_games[self.game_id]['paddle1_position']['y'] = 5.03 + data['mouse_position']['y'] * 2
        elif self.player_number == 'player2':
            PongConsumer.shared_games[self.game_id]['paddle2_position']['x'] = -5.5 * data['mouse_position']['x']
            PongConsumer.shared_games[self.game_id]['paddle2_position']['z'] = -11 + abs(data['mouse_position']['x'] * 2)
            PongConsumer.shared_games[self.game_id]['paddle2_position']['y'] = 5.03 + data['mouse_position']['y'] * 2

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


from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import random
import math
import time
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import Match

class SpaceRivalryConsumer(AsyncWebsocketConsumer):
    # Class variables for shared state
    shared_games = {}
    game_loops = {}
    active_connections = {}
    connection_timestamps = {}
    disconnection_cleanup_tasks = {}
    
    # Game constants
    GAME_WIDTH = 800
    GAME_HEIGHT = 600
    SHIP_WIDTH = 40
    SHIP_HEIGHT = 30
    LASER_WIDTH = 4
    LASER_HEIGHT = 15
    ASTEROID_SIZE = 30
    DEBRIS_SIZE = 20
    POWERUP_SIZE = 25
    MOVEMENT_SPEED = 5

    # Power-up configurations
    POWERUPS = {
        'RAPID_FIRE': {'duration': 5000, 'color': 'yellow'},
        'SHIELD': {'duration': 8000, 'color': 'cyan'},
        'DOUBLE_BULLETS': {'duration': 6000, 'color': 'magenta'},
        'SLOW_MOTION': {'duration': 4000, 'color': 'lime'}
    }

    # Asteroid configurations
    ASTEROID_TYPES = {
        'NORMAL': {'speed': 2, 'size': ASTEROID_SIZE, 'health': 1, 'points': 100},
        'FAST': {'speed': 4, 'size': ASTEROID_SIZE * 0.7, 'health': 1, 'points': 150},
        'SPLIT': {'speed': 1.5, 'size': ASTEROID_SIZE * 1.2, 'health': 1, 'points': 200},
        'EXPLODING': {'speed': 1, 'size': ASTEROID_SIZE * 1.3, 'health': 1, 'points': 300}
    }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_group_name = None
        self.game_id = None
        self.username = None
        self.player_num = None
        self.reconnection_grace_period = 5
        self.delta_time = 1/60

    @database_sync_to_async
    def check_match_status(self):
        try:
            match = Match.objects.get(id=self.game_id)
            return match.status == "completed"
        except Match.DoesNotExist:
            return False

    async def connect(self):
        # Get game ID from URL
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        query_string = self.scope['query_string'].decode()
        params = dict(param.split('=') for param in query_string.split('&'))
        self.username = params.get('username')

        if not self.game_id or not self.username:
            await self.close()
            return

        self.room_group_name = f'space_rivalry_{self.game_id}'

        # Check if match is already completed
        is_completed = await self.check_match_status()
        if is_completed:
            await self.close()
            return

        self.connection_timestamps[self.channel_name] = time.time()

        # Cancel any pending disconnection cleanup
        if self.game_id in self.disconnection_cleanup_tasks:
            self.disconnection_cleanup_tasks[self.game_id].cancel()
            del self.disconnection_cleanup_tasks[self.game_id]

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Initialize game state if it doesn't exist
        if self.game_id not in self.shared_games:
            self.initialize_game_state()
            if self.game_id not in self.game_loops:
                self.game_loops[self.game_id] = asyncio.create_task(self.game_loop())

        # Handle player reconnection
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

        if connection_duration < 1:
            await self.handle_unstable_connection()
            return

        # Start cleanup task
        cleanup_task = asyncio.create_task(
            self.delayed_cleanup(self.game_id, self.player_num)
        )
        self.disconnection_cleanup_tasks[self.game_id] = cleanup_task

        # Notify other players
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
                if data['isPlayer1']:
                    self.player_num = 'player1'
                    game_state['player1'] = data['username']
                    game_state['player2'] = data['opponent']
                else:
                    self.player_num = 'player2'
                    game_state['player1'] = data['opponent']
                    game_state['player2'] = data['username']

                # Start game if both players are ready
                if game_state['player1'] and game_state['player2']:
                    game_state['gameStarted'] = True

            elif data['type'] == 'player_input':
                self.handle_player_input(data['input'])

            await self.broadcast_game_state()

        except Exception as e:
            print(f"Error in receive: {e}")
            await self.send_error("An error occurred processing your input")

    async def handle_unstable_connection(self):
        """Handle very brief connections that might indicate technical issues"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'connection_warning',
                'message': 'Unstable connection detected. Please check your internet connection.'
            }
        )

    def handle_player_input(self, input_type):
        """Handle player movement and shooting"""
        game_state = self.shared_games[self.game_id]
        player_pos_key = f'player{self.player_num[-1]}Pos'
        
        if input_type == 'left':
            current_pos = game_state[player_pos_key]
            min_pos = self.SHIP_WIDTH/2 if self.player_num == 'player1' else self.GAME_WIDTH/2 + self.SHIP_WIDTH/2
            game_state[player_pos_key] = max(min_pos, current_pos - self.MOVEMENT_SPEED)
            
        elif input_type == 'right':
            current_pos = game_state[player_pos_key]
            max_pos = self.GAME_WIDTH/2 - self.SHIP_WIDTH/2 if self.player_num == 'player1' else self.GAME_WIDTH - self.SHIP_WIDTH/2
            game_state[player_pos_key] = min(max_pos, current_pos + self.MOVEMENT_SPEED)
            
        elif input_type == 'shoot':
            self.handle_shooting(game_state)

    def handle_shooting(self, game_state):
        """Handle player shooting with cooldown and power-ups"""
        player_num = int(self.player_num[-1])
        current_time = time.time() * 1000  # Convert to milliseconds
        last_shot_key = f'lastShot{player_num}'
        
        # Check cooldown
        if current_time - game_state.get(last_shot_key, 0) >= self.get_shooting_cooldown(game_state, player_num):
            player_pos = game_state[f'player{player_num}Pos']
            lasers_key = f'lasers{player_num}'
            effects = game_state[f'activeEffects{player_num}']
            
            # Apply power-ups
            if effects.get('DOUBLE_BULLETS', {}).get('active'):
                game_state[lasers_key].extend([
                    {'x': player_pos - 10, 'y': self.GAME_HEIGHT - self.SHIP_HEIGHT - 10},
                    {'x': player_pos + 10, 'y': self.GAME_HEIGHT - self.SHIP_HEIGHT - 10}
                ])
            else:
                game_state[lasers_key].append({
                    'x': player_pos,
                    'y': self.GAME_HEIGHT - self.SHIP_HEIGHT - 10
                })
            
            game_state[last_shot_key] = current_time

    def get_shooting_cooldown(self, game_state, player_num):
        """Get shooting cooldown based on power-ups"""
        effects = game_state[f'activeEffects{player_num}']
        return 250 if effects.get('RAPID_FIRE', {}).get('active') else 500

    async def game_loop(self):
        """Main game loop"""
        try:
            while True:
                if self.game_id in self.shared_games:
                    game_state = self.shared_games[self.game_id]
                    current_time = time.time()
                    dt = current_time - game_state['lastUpdate']
                    
                    if game_state['gameStarted'] and not game_state['gameOver']:
                        self.update_game_state(dt)
                        game_state['lastUpdate'] = current_time
                        await self.check_game_over()
                        await self.broadcast_game_state()
                
                await asyncio.sleep(self.delta_time)
                
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error in game loop: {e}")

    def initialize_game_state(self):
        """Set up initial game state"""
        self.shared_games[self.game_id] = {
            'gameStarted': False,
            'gameOver': False,
            'player1': None,
            'player2': None,
            'player1Pos': self.GAME_WIDTH / 4,
            'player2Pos': 3 * self.GAME_WIDTH / 4,
            'health1': 100,
            'health2': 100,
            'score1': 0,
            'score2': 0,
            'lasers1': [],
            'lasers2': [],
            'asteroids': [],
            'debris': [],
            'powerups': [],
            'explosions': [],
            'activeEffects1': {},
            'activeEffects2': {},
            'combo1': 0,
            'combo2': 0,
            'wave': 1,
            'difficulty': 1,
            'lastUpdate': time.time(),
            'winner': None
        }

    def update_game_state(self, dt):
        """Update all game objects"""
        game_state = self.shared_games[self.game_id]
        
        # Update lasers
        self.update_lasers(game_state)
        
        # Update asteroids with slow motion effect
        slow_motion = any(
            game_state[f'activeEffects{i}'].get('SLOW_MOTION', {}).get('active')
            for i in [1, 2]
        )
        speed_multiplier = 0.5 if slow_motion else 1
        
        # Update asteroids
        self.update_asteroids(game_state, speed_multiplier)
        
        # Update power-ups
        self.update_powerups(game_state)
        
        # Update debris
        self.update_debris(game_state)
        
        # Update explosions
        self.update_explosions(game_state)
        
        # Check collisions
        self.check_all_collisions(game_state)
        
        # Increase difficulty
        game_state['difficulty'] = min(game_state['difficulty'] + 0.1 * dt / 30, 3)
        
        # Maybe spawn new asteroid
        if random.random() < 0.02 * game_state['difficulty']:
            self.spawn_asteroid(game_state)

    def update_lasers(self, game_state):
        """Update laser positions"""
        for player in [1, 2]:
            game_state[f'lasers{player}'] = [
                {**laser, 'y': laser['y'] - 10}
                for laser in game_state[f'lasers{player}']
                if laser['y'] > 0
            ]

    def update_asteroids(self, game_state, speed_multiplier):
        """Update asteroid positions"""
        game_state['asteroids'] = [
            {**asteroid, 'y': asteroid['y'] + asteroid['speed'] * speed_multiplier}
            for asteroid in game_state['asteroids']
            if asteroid['y'] < self.GAME_HEIGHT + asteroid['size']
        ]

    def update_powerups(self, game_state):
        """Update power-up positions and status"""
        current_time = time.time() * 1000
        
        # Update positions
        game_state['powerups'] = [
            {**powerup, 'y': powerup['y'] + 2}
            for powerup in game_state['powerups']
            if powerup['y'] < self.GAME_HEIGHT
        ]
        
        # Check power-up durations
        for player in [1, 2]:
            effects_key = f'activeEffects{player}'
            for powerup_type, effect in game_state[effects_key].items():
                if effect.get('active') and current_time >= effect.get('endsAt', 0):
                    game_state[effects_key][powerup_type] = {'active': False}

    def update_debris(self, game_state):
        """Update debris positions"""
        game_state['debris'] = [
            {**debris, 'y': debris['y'] + 3}
            for debris in game_state['debris']
            if debris['y'] < self.GAME_HEIGHT
        ]

    def update_explosions(self, game_state):
        """Update explosion effects"""
        current_time = time.time() * 1000
        game_state['explosions'] = [
            explosion for explosion in game_state['explosions']
            if current_time - explosion['created'] < 500
        ]

    def check_all_collisions(self, game_state):
        """Check all possible collisions in the game"""
        # Check laser-asteroid collisions
        self.check_laser_collisions(game_state, 1)
        self.check_laser_collisions(game_state, 2)
        
        # Check ship collisions
        self.check_ship_collisions(game_state)
        
        # Check power-up collections
        self.check_powerup_collisions(game_state)

    def check_laser_collisions(self, game_state, player_num):
        """Check collisions between lasers and asteroids"""
        lasers_key = f'lasers{player_num}'
        new_lasers = []
        current_time = time.time() * 1000

        for laser in game_state[lasers_key]:
            hit = False
            for asteroid in game_state['asteroids'][:]:  # Copy list for safe iteration
                if self.check_collision(
                    laser['x'], laser['y'], self.LASER_WIDTH, self.LASER_HEIGHT,
                    asteroid['x'], asteroid['y'], asteroid['size'], asteroid['size']
                ):
                    hit = True
                    game_state['asteroids'].remove(asteroid)
                    
                    # Handle special asteroid types
                    if asteroid['type'] == 'SPLIT':
                        self.split_asteroid(game_state, asteroid)
                    elif asteroid['type'] == 'EXPLODING':
                        self.create_explosion(game_state, asteroid)
                        self.damage_nearby_asteroids(game_state, asteroid)
                    
                    # Update score and combo
                    self.update_score(game_state, player_num, asteroid['points'])
                    
                    # Spawn power-up chance
                    if random.random() < 0.2:
                        self.spawn_powerup(game_state, asteroid)
                    
                    # Create debris targeting opposite player
                    self.create_debris(game_state, asteroid, 3 - player_num)
                    break
                    
            if not hit:
                new_lasers.append(laser)
                
        game_state[lasers_key] = new_lasers

    def check_ship_collisions(self, game_state):
        """Check collisions between ships and hazards (asteroids/debris)"""
        for player_num in [1, 2]:
            if game_state[f'activeEffects{player_num}'].get('SHIELD', {}).get('active'):
                continue
                
            ship_pos = game_state[f'player{player_num}Pos']
            
            # Check asteroid collisions
            for asteroid in game_state['asteroids'][:]:
                if self.check_collision(
                    ship_pos, self.GAME_HEIGHT - self.SHIP_HEIGHT, self.SHIP_WIDTH, self.SHIP_HEIGHT,
                    asteroid['x'], asteroid['y'], asteroid['size'], asteroid['size']
                ):
                    game_state[f'health{player_num}'] = max(0, game_state[f'health{player_num}'] - 20)
                    game_state['asteroids'].remove(asteroid)
                    
            # Check debris collisions
            for debris in game_state['debris'][:]:
                if debris['targetPlayer'] == player_num and self.check_collision(
                    ship_pos, self.GAME_HEIGHT - self.SHIP_HEIGHT, self.SHIP_WIDTH, self.SHIP_HEIGHT,
                    debris['x'], debris['y'], self.DEBRIS_SIZE, self.DEBRIS_SIZE
                ):
                    game_state[f'health{player_num}'] = max(0, game_state[f'health{player_num}'] - 10)
                    game_state['debris'].remove(debris)

    def check_powerup_collisions(self, game_state):
        """Check collisions between ships and power-ups"""
        current_time = time.time() * 1000
        
        for player_num in [1, 2]:
            ship_pos = game_state[f'player{player_num}Pos']
            
            for powerup in game_state['powerups'][:]:
                if self.check_collision(
                    ship_pos, self.GAME_HEIGHT - self.SHIP_HEIGHT, self.SHIP_WIDTH, self.SHIP_HEIGHT,
                    powerup['x'], powerup['y'], self.POWERUP_SIZE, self.POWERUP_SIZE
                ):
                    # Activate power-up
                    effects_key = f'activeEffects{player_num}'
                    game_state[effects_key][powerup['type']] = {
                        'active': True,
                        'endsAt': current_time + self.POWERUPS[powerup['type']]['duration']
                    }
                    game_state['powerups'].remove(powerup)

    def check_collision(self, x1, y1, w1, h1, x2, y2, w2, h2):
        """Check if two rectangles overlap"""
        return (
            abs(x1 - x2) * 2 < (w1 + w2) and
            abs(y1 - y2) * 2 < (h1 + h2)
        )

    def update_score(self, game_state, player_num, points):
        """Update player score and combo"""
        combo_key = f'combo{player_num}'
        score_key = f'score{player_num}'
        
        game_state[combo_key] += 1
        combo_multiplier = 1 + game_state[combo_key] // 5
        game_state[score_key] += points * combo_multiplier
        
        # Reset combo timeout
        game_state[f'lastHit{player_num}'] = time.time() * 1000

    def spawn_asteroid(self, game_state):
        """Spawn a new asteroid"""
        asteroid_type = random.choice(list(self.ASTEROID_TYPES.keys()))
        asteroid_data = self.ASTEROID_TYPES[asteroid_type]
        
        game_state['asteroids'].append({
            'x': random.uniform(0, self.GAME_WIDTH),
            'y': -asteroid_data['size'],
            'type': asteroid_type,
            **asteroid_data
        })

    def split_asteroid(self, game_state, asteroid):
        """Split an asteroid into smaller ones"""
        for offset in [-20, 20]:
            game_state['asteroids'].append({
                'x': asteroid['x'] + offset,
                'y': asteroid['y'],
                'type': 'NORMAL',
                **self.ASTEROID_TYPES['NORMAL']
            })

    def create_explosion(self, game_state, asteroid):
        """Create an explosion effect"""
        game_state['explosions'].append({
            'x': asteroid['x'],
            'y': asteroid['y'],
            'created': time.time() * 1000
        })

    def damage_nearby_asteroids(self, game_state, exploding_asteroid):
        """Damage asteroids near an explosion"""
        explosion_radius = 100
        for asteroid in game_state['asteroids'][:]:
            dx = asteroid['x'] - exploding_asteroid['x']
            dy = asteroid['y'] - exploding_asteroid['y']
            distance = math.sqrt(dx * dx + dy * dy)
            
            if distance < explosion_radius:
                game_state['asteroids'].remove(asteroid)

    def spawn_powerup(self, game_state, asteroid):
        """Spawn a power-up at asteroid's location"""
        powerup_type = random.choice(list(self.POWERUPS.keys()))
        game_state['powerups'].append({
            'x': asteroid['x'],
            'y': asteroid['y'],
            'type': powerup_type,
            **self.POWERUPS[powerup_type]
        })

    def create_debris(self, game_state, asteroid, target_player):
        """Create debris from destroyed asteroid"""
        game_state['debris'].append({
            'x': asteroid['x'],
            'y': asteroid['y'],
            'targetPlayer': target_player
        })

    async def check_game_over(self):
        """Check if game should end"""
        game_state = self.shared_games[self.game_id]
        
        if game_state['health1'] <= 0 or game_state['health2'] <= 0:
            game_state['gameOver'] = True
            winner = game_state['player2'] if game_state['health1'] <= 0 else game_state['player1']
            game_state['winner'] = winner
            
            await self.update_match_record(game_state)
            await self.broadcast_game_end(winner)

    @database_sync_to_async
    def update_match_record(self, game_state):
        """Update match record in database"""
        try:
            match = Match.objects.get(id=self.game_id)
            winner_username = game_state['winner']
            winner_user = get_user_model().objects.get(username=winner_username)
            
            match.winner = winner_user
            match.score_player1 = game_state['score1']
            match.score_player2 = game_state['score2']

            match.status = "completed"
            match.save()
        except Exception as e:
            print(f"Error updating match record: {e}")

    async def broadcast_game_end(self, winner):
        """Broadcast game end to all players"""
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'game_ended',
                'winner': winner,
                'state': self.shared_games[self.game_id]
            }
        )

    async def broadcast_game_state(self):
        """Send current game state to all players"""
        if self.game_id in self.shared_games:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'game_state_update',
                    'state': self.shared_games[self.game_id]
                }
            )

    # Message handlers
    async def game_state_update(self, event):
        """Send game state update to client"""
        await self.send(text_data=json.dumps({
            'type': 'game_state',
            'state': event['state']
        }))

    async def player_disconnected(self, event):
        """Handle player disconnection"""
        await self.send(text_data=json.dumps({
            'type': 'player_disconnected',
            'message': event['message']
        }))

    async def player_reconnected(self, event):
        """Handle player reconnection"""
        await self.send(text_data=json.dumps({
            'type': 'player_reconnected',
            'message': event['message']
        }))

    async def game_ended(self, event):
        """Handle game end"""
        await self.send(text_data=json.dumps({
            'type': 'game_ended',
            'winner': event['winner'],
            'state': event['state']
        }))

    async def send_error(self, message):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message
        }))