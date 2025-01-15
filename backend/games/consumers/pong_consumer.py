from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import time
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from ..models import Match
from ..utils import PlayersManager


User = get_user_model()


class PongConsumer(AsyncWebsocketConsumer):

    shared_games = {}
    game_loops = {}
    active_connections = {}
    connection_timestamps = {}
    disconnection_cleanup_tasks = {}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_group_name = None
        self.player_number = None
        self.game_id = None
        self.username = None
        self.delta_time = 1/60
        self.reconnection_grace_period = 5

    @database_sync_to_async
    def check_match_status(self):
        try:
            match = Match.objects.get(id=self.game_id)
            return match.status == "completed"
        except Match.DoesNotExist:
            return False

    # @database_sync_to_async
    # def get_user_ingame(self, username):
    #     user = get_user_model().objects.filter(username=username).first()
    #     return user.ingame

    # @database_sync_to_async
    # def update_user_ingame(self, username, ingame):
    #     user = get_user_model().objects.filter(username=username).first()
    #     user.ingame = ingame
    #     user.save()

    async def connect(self):
        self.user = self.scope.get('user', None)

        if self.user is None:
            await self.close()
            return
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.username = self.user.username

        # await self.update_user_ingame(self.username, True)
        PlayersManager.add_player(self.username)

        if not self.game_id or not self.username:
            await self.close()
            return

        self.room_group_name = f'pong_{self.game_id}'

        is_completed = await self.check_match_status()
        if is_completed:
            await self.close(code=4000)
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
            self.delayed_cleanup(self.game_id, self.player_number)
        )
        self.disconnection_cleanup_tasks[self.game_id] = cleanup_task

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

        # await self.update_user_ingame(self.username, False)

        if self.game_id in self.active_connections:
            self.active_connections[self.game_id] -= 1

    async def delayed_cleanup(self, game_id, player_number):
        try:
            await asyncio.sleep(self.reconnection_grace_period)

            if game_id in self.shared_games:
                game_state = self.shared_games[game_id]

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

    async def handle_unstable_connection(self):
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'connection_warning',
                'message': 'Unstable connection detected. Please check your internet connection.'
            }
        )

    def initialize_game_state(self):
        self.shared_games[self.game_id] = {
            'game_id': self.game_id,
            'player1': None,
            'player2': None,
            'ball_position': {
                'x': 0,
                'y': 5.0387,
                'z': -8
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
            'winner': None,
            'game_started': False,
            'last_update': time.time()
        }

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)

            if data['type'] == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': time.time()
                }))
                return

            if data['type'] == 'client_disconnect':
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'player_disconnected',
                        'player': self.player_number,
                        'message': 'Opponent left the game'
                    }
                )
                await self.close()
                return

            if data['type'] == 'init':
                await self.handle_init(data)
            elif data['type'] == 'mouse_move':
                self.update_paddle_position(data)
            elif data['type'] == 'ball_position':
                self.update_ball_position(data)
            elif data['type'] == 'score_update':
                await self.handle_score_update(data)
            elif data['type'] == 'game_won':
                await self.handle_game_won(data)
            elif data['type'] == 'match_complete':
                await self.handle_match_complete(data)

            await self.broadcast_game_state()

        except Exception as e:
            print(f"Error in receive: {e}")
            await self.send_error("An error occurred processing your input")

    async def handle_init(self, data):
        if data['isPlayer1']:
            self.player_number = 'player1'
            self.shared_games[self.game_id]['player1'] = data['username']
            self.shared_games[self.game_id]['player2'] = data['opponent']
        else:
            self.player_number = 'player2'
            self.shared_games[self.game_id]['player1'] = data['opponent']
            self.shared_games[self.game_id]['player2'] = data['username']

        if all([self.shared_games[self.game_id]['player1'],
                self.shared_games[self.game_id]['player2']]):
            self.shared_games[self.game_id]['game_started'] = True

    def update_paddle_position(self, data):
        if self.player_number == 'player1':
            self.shared_games[self.game_id]['paddle1_position'].update({
                'x': 5.5 * data['mouse_position']['x'],
                'z': 11 - abs(data['mouse_position']['x'] * 2),
                'y': 5.03 + data['mouse_position']['y'] * 2
            })
        elif self.player_number == 'player2':
            self.shared_games[self.game_id]['paddle2_position'].update({
                'x': -5.5 * data['mouse_position']['x'],
                'z': -11 + abs(data['mouse_position']['x'] * 2),
                'y': 5.03 + data['mouse_position']['y'] * 2
            })

    def update_ball_position(self, data):
        self.shared_games[self.game_id]['ball_position'].update(data['ball_position'])

    async def handle_score_update(self, data):
        game_state = self.shared_games[self.game_id]
        game_state['scores'] = data['scores']

        if 'scoring_history' not in game_state:
            game_state['scoring_history'] = []
        game_state['scoring_history'].append({
            'scorer': data['scoringPlayer'],
            'score': data['scores']
        })

    async def handle_game_won(self, data):
        game_state = self.shared_games[self.game_id]
        game_state['rounds_won'] = data['matches']
        game_state['current_game_winner'] = data['winner']
        game_state['scores'] = {'player1': 0, 'player2': 0}

    async def handle_match_complete(self, data):
        game_state = self.shared_games[self.game_id]
        winner_username = self.get_user_from_player_number(data['winner'])
        game_state['winner'] = winner_username
        game_state['final_score'] = data['finalScore']

        await self.update_match_record(data)

        game_state['scores'] = {'player1': 0, 'player2': 0}
        game_state['rounds_won'] = {'player1': 0, 'player2': 0}

    async def game_loop(self):
        try:
            while True:
                if self.game_id in self.shared_games:
                    game_state = self.shared_games[self.game_id]
                    current_time = time.time()
                    dt = current_time - game_state['last_update']

                    if game_state['game_started'] and not game_state.get('winner'):
                        game_state['last_update'] = current_time
                        await self.broadcast_game_state()

                await asyncio.sleep(self.delta_time)

        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"Error in game loop: {e}")

    @database_sync_to_async
    def update_match_record(self, data):
        try:
            match = Match.objects.get(id=self.game_id)
            winner_username = self.get_user_from_player_number(data['winner'])
            winner_user = get_user_model().objects.get(username=winner_username)

            match.winner = winner_user
            match.final_score = f"{data['finalScore']['player1']}-{data['finalScore']['player2']}"
            match.score_player1 = self.shared_games[self.game_id]['rounds_won']['player1']
            match.score_player2 = self.shared_games[self.game_id]['rounds_won']['player2']
            match.forfeit = data.get('forfeit', False)
            match.ended_at = timezone.now()
            match.status = "completed"
            match.save()
        except Exception as e:
            print(f"Error updating match record: {e}")

    def get_user_from_player_number(self, player_number):
        game_state = self.shared_games[self.game_id]
        return game_state['player1'] if player_number == 'player1' else game_state['player2']

    async def broadcast_game_state(self):
        if self.game_id in self.shared_games:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_game_state',
                    'state': self.shared_games[self.game_id]
                }
            )

    async def send_game_state(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_state',
            'state': event['state']
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

    async def connection_warning(self, event):
        await self.send(text_data=json.dumps({
            'type': 'connection_warning',
            'message': event['message']
        }))

    async def game_ended_by_forfeit(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_ended_by_forfeit',
            'state': event['state'],
            'message': event['message']
        }))

    async def send_error(self, message):
        """Send error message to client"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message,
            'timestamp': time.time()
        }))

    @database_sync_to_async
    def get_user_by_username(self, username):
        """Get user object from username"""
        User = get_user_model()
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None

    def handle_game_state_update(self, game_state):
        current_time = time.time()

        if 'last_activity' in game_state:
            if current_time - game_state['last_activity'] > 30:
                game_state['connection_warning'] = True

        game_state['last_activity'] = current_time

        if not game_state.get('winner'):
            p1_score = game_state['rounds_won'].get('player1', 0)
            p2_score = game_state['rounds_won'].get('player2', 0)

            if p1_score >= 3 or p2_score >= 3:
                game_state['winner'] = game_state['player1'] if p1_score > p2_score else game_state['player2']
                game_state['game_complete'] = True

    def validate_game_state(self):
        """Validate current game state"""
        if self.game_id not in self.shared_games:
            return False

        game_state = self.shared_games[self.game_id]
        required_fields = ['player1', 'player2', 'scores', 'rounds_won']

        return all(field in game_state for field in required_fields)

    async def handle_reconnection(self):
        if not self.validate_game_state():
            await self.send_error("Invalid game state on reconnection")
            return False

        game_state = self.shared_games[self.game_id]
        game_state['connection_warning'] = False
        game_state['last_activity'] = time.time()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'player_reconnected',
                'message': f"{self.username} has reconnected",
                'timestamp': time.time()
            }
        )
        return True