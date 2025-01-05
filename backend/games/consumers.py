# game/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import sync_to_async
import asyncio
import numpy as np

class PongConsumer(AsyncWebsocketConsumer):
    players = {}
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.game_state = {
            'ball_position': {'x': 0, 'y': 5.0387, 'z': -8},
            'ball_velocity': {'x': 0, 'y': 4, 'z': 14},
            'paddle1_position': {'x': 0, 'y': 4.0387, 'z': 10},
            'paddle2_position': {'x': 0, 'y': 4.0387, 'z': -10},
            'scores': {'player1': 0, 'player2': 0},
            'matches': {'player1': 0, 'player2': 0},
            'game_status': 'waiting',  # waiting, playing, finished
            'player_side_bounces': {'player1': 0, 'player2': 0},
            'last_hit': 'player2'  # player1 or player2
        }
        self.room_group_name = None
        self.game_id = None
        self.player_number = None
        self.game_loop_task = None
        self.delta_time = 1/60  # 60 FPS

    async def connect(self):
        username = self.scope['query_string'].decode().split('=')[1]
        for room_players in self.players.values():
            if any(player.username == username for player in room_players):
                await self.close()
                return
        user = await sync_to_async(get_user_model().objects.get)(username=username)
        self.scope['user'] = user
        self.user = user
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.room_group_name = f'game_{self.game_id}'

        # Add to room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Accept connection
        await self.accept()

        # Assign player number (1 or 2)
        await self.assign_player_number()

    async def assign_player_number(self):
        if self.room_group_name not in self.players:
            self.players[self.room_group_name] = []

        self.players[self.room_group_name].append(self.user)

        group_channels = self.players[self.room_group_name]
        if len(group_channels) == 1:
            self.player_number = 1
            self.game_state['game_status'] = 'waiting'
        elif len(group_channels) == 2:
            self.player_number = 2
            self.game_state['game_status'] = 'playing'
            # Start game loop when second player joins
            self.game_loop_task = asyncio.create_task(self.game_loop())
        else:
            # Room is full
            await self.close()
            return

        # Send initial state to the client
        await self.send(json.dumps({
            'type': 'game_state',
            'player_number': self.player_number,
            'state': self.game_state
        }))


    async def disconnect(self, close_code):
    # Cancel the game loop first
        if self.game_loop_task and not self.game_loop_task.cancelled():
            self.game_loop_task.cancel()
            try:
                await self.game_loop_task
            except asyncio.CancelledError:
                pass

        # Only try to remove from group if we have a valid room_group_name
        if self.room_group_name is not None:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

            # Update player list
            if self.room_group_name in self.players:
                if self.user in self.players[self.room_group_name]:
                    self.players[self.room_group_name].remove(self.user)
                
                # If no players left, clean up the room
                if not self.players[self.room_group_name]:
                    del self.players[self.room_group_name]

    async def receive(self, text_data):
        data = json.loads(text_data)
        
        if data['type'] == 'paddle_position':
            # Update paddle position
            if self.player_number == 1:
                self.game_state['paddle1_position'].update(data['position'])
            else:
                self.game_state['paddle2_position'].update(data['position'])

        # Broadcast game state to room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'broadcast_game_state',
                'state': self.game_state
            }
        )

    async def broadcast_game_state(self, event):
        try:
            if self.channel_layer is not None:  # Check if still connected
                await self.send(text_data=json.dumps({
                    'type': 'game_state',
                    'state': event['state']
                }))
        except Exception:
            # Handle gracefully if the connection is already closed
            pass

    def check_collision(self, ball_pos, paddle_pos, is_player1):
        # Simplified collision detection
        paddle_width = 2  # Approximate paddle width
        paddle_height = 1  # Approximate paddle height
        ball_radius = 0.1

        # Check if ball is within paddle bounds
        x_collision = abs(ball_pos['x'] - paddle_pos['x']) < (paddle_width / 2 + ball_radius)
        y_collision = abs(ball_pos['y'] - paddle_pos['y']) < (paddle_height / 2 + ball_radius)
        z_collision = abs(ball_pos['z'] - paddle_pos['z']) < (ball_radius + 0.5)

        return x_collision and y_collision and z_collision

    def apply_collision_response(self, is_player1):
        ball_pos = self.game_state['ball_position']
        paddle_pos = self.game_state['paddle1_position'] if is_player1 else self.game_state['paddle2_position']

        # Calculate hit direction based on where the ball hits the paddle
        hit_direction = (ball_pos['x'] - paddle_pos['x']) / 2  # Normalized by paddle width
        
        # Calculate forces
        force_x = hit_direction * 3
        force_y = np.log((ball_pos['y'] - paddle_pos['y']) / 1 + 1) * 6 + 2
        force_z = 14 * (-1 if is_player1 else 1)

        # Update velocity
        self.game_state['ball_velocity'] = {
            'x': force_x,
            'y': force_y,
            'z': force_z
        }
        
        # Reset bounce counters
        self.game_state['player_side_bounces'] = {'player1': 0, 'player2': 0}
        
        # Update last hit
        self.game_state['last_hit'] = 'player1' if is_player1 else 'player2'

    async def game_loop(self):
        try:
            while True:
                if self.game_state['game_status'] == 'playing':
                    # Apply gravity
                    self.game_state['ball_velocity']['y'] -= 9.82 * self.delta_time

                    # Update ball position
                    for axis in ['x', 'y', 'z']:
                        self.game_state['ball_position'][axis] += (
                            self.game_state['ball_velocity'][axis] * self.delta_time
                        )

                    # Ground collision
                    if self.game_state['ball_position']['y'] < 0.5:
                        self.game_state['ball_velocity']['y'] *= -0.5
                        self.game_state['ball_position']['y'] = 0.5

                    # Check paddle collisions
                    if (self.check_collision(
                        self.game_state['ball_position'],
                        self.game_state['paddle1_position'],
                        True
                    ) and self.game_state['last_hit'] == 'player2'):
                        self.apply_collision_response(True)

                    elif (self.check_collision(
                        self.game_state['ball_position'],
                        self.game_state['paddle2_position'],
                        False
                    ) and self.game_state['last_hit'] == 'player1'):
                        self.apply_collision_response(False)

                    # Check table collision and scoring
                    if abs(self.game_state['ball_position']['z']) > 12:
                        # Score point
                        if self.game_state['ball_position']['z'] > 0:
                            self.game_state['scores']['player2'] += 1
                        else:
                            self.game_state['scores']['player1'] += 1

                        # Reset ball
                        self.game_state['ball_position'] = {
                            'x': 0,
                            'y': 5.0387,
                            'z': -8 if self.game_state['ball_position']['z'] > 0 else 8
                        }
                        self.game_state['ball_velocity'] = {
                            'x': 0,
                            'y': 4,
                            'z': 14 if self.game_state['ball_position']['z'] > 0 else -14
                        }

                    # Check win condition
                    if max(self.game_state['scores'].values()) >= 11:
                        # Check for 2 point lead
                        score_diff = abs(
                            self.game_state['scores']['player1'] - 
                            self.game_state['scores']['player2']
                        )
                        if score_diff >= 2:
                            winner = 'player1' if self.game_state['scores']['player1'] > self.game_state['scores']['player2'] else 'player2'
                            self.game_state['matches'][winner] += 1
                            
                            # Reset scores
                            self.game_state['scores'] = {'player1': 0, 'player2': 0}
                            
                            # Check match win
                            if self.game_state['matches'][winner] >= 2:
                                self.game_state['game_status'] = 'finished'
                                self.game_state['matches'] = {'player1': 0, 'player2': 0}

                    # Broadcast updated state
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'broadcast_game_state',
                            'state': self.game_state
                        }
                    )

                await asyncio.sleep(self.delta_time)  # 60 FPS

        except asyncio.CancelledError:
            pass


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
