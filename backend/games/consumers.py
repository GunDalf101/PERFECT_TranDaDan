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

    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.room_group_name = f'pong_{self.game_id}'

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
            print(winner_username)
            winner_user = get_user_model().objects.get(username=winner_username)
            
            match.winner = winner_user
            match.final_score = f"{data['finalScore']['player1']}-{data['finalScore']['player2']}"
            match.score_player1 = PongConsumer.shared_games[self.game_id] ['rounds_won']['player1']
            match.score_player2 = PongConsumer.shared_games[self.game_id] ['rounds_won']['player2']
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
