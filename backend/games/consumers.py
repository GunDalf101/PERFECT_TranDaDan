import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PongConsumer(AsyncWebsocketConsumer):
    players = {}

    async def connect(self):
        self.game_id = self.scope['url_route']['kwargs']['game_id']
        self.room_name = f"game_{self.game_id}"
        
        if not hasattr(self.channel_layer, "rooms"):
            self.channel_layer.rooms = {}
        if self.room_name not in self.channel_layer.rooms:
            self.channel_layer.rooms[self.room_name] = {"players": []}
            
        players = self.channel_layer.rooms[self.room_name]["players"]

        await self.channel_layer.group_add(
            self.room_name,
            self.channel_name
        )
        await self.accept()
        if len(players) < 2:
            self.player_z = 10 if len(players) == 0 else -10
            players.append(self.player_z)
            await self.send(text_data=json.dumps({"action": "player_join", "player_z": self.player_z}))
        else:
            await self.close()
            return
        

    async def disconnect(self, close_code):
        players = self.channel_layer.rooms[self.room_name]["players"]
        players.remove(self.player_z)
        await self.channel_layer.group_discard(
            self.room_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get("action")
        print(f"Received data: {data}")
        await self.channel_layer.group_send(
            self.room_name,
            {
                "type": "game_update",
                "message": data
            }
        )
        
        if action == "update_game_state":
            await self.channel_layer.group_send(
                self.room_name,
                {
                    "type": "game_state_update",
                    "message": data
                }
            )

        if action == "move":
            await self.channel_layer.group_send(
                self.room_name,
                {
                    "type": "game_update",
                    "message": data
                }
            )
        elif action == "start":
            await self.channel_layer.group_send(
                self.room_name,
                {
                    "type": "game_update",
                    "message": data
                }
            )

    async def game_update(self, event):
        await self.send(text_data=json.dumps(event["message"]))


class MatchmakingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Player joins the matchmaking room
        self.room_name = 'matchmaking_room'
        self.room_group_name = 'matchmaking'

        # Join the matchmaking group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Accept the WebSocket connection
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the matchmaking group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Receive player data (can be used to send a specific message, username, etc.)
        text_data_json = json.loads(text_data)
        player_username = text_data_json['username']

        # Logic for matchmaking (this could be moved to a database model for storing players waiting)
        opponent_username = await self.find_opponent(player_username)

        # Send opponent data to both players
        if opponent_username:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_opponent',
                    'player_username': player_username,
                    'opponent_username': opponent_username,
                }
            )

    async def send_opponent(self, event):
        # Send opponent info to both players
        await self.send(text_data=json.dumps({
            'player_username': event['player_username'],
            'opponent_username': event['opponent_username'],
        }))

    async def find_opponent(self, player_username):
        # Logic to find an opponent
        # This could be a queue system in the database or a simple match based on who is online
        # For now, returning a mock opponent
        return "OpponentPlayer"