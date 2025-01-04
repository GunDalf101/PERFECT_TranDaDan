import json
from channels.generic.websocket import AsyncWebsocketConsumer, AsyncJsonWebsocketConsumer
from .models import MatchmakingQueue, Match
from asgiref.sync import sync_to_async
import asyncio
import hashlib


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
                    "username": player1.scope['user'].username
                })
                await player2.send_json({
                    "status": "matched",
                    "opponent": player1.scope['user'].username,
                    "game_id": match.id,
                    "username": player2.scope['user'].username
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
