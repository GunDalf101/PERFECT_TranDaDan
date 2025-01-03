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
