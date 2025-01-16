import json
from channels.db import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from ..utils import PlayersManager
from ..models import Match
import time

class InviteConsumer(AsyncJsonWebsocketConsumer):
    active_connections = {}
    pending_invites = {}

    async def connect(self):
        user = self.user = self.scope.get('user', None)
        self.username = user.username

        if self.user is None:
            await self.close()
            return
        
        InviteConsumer.active_connections[self.username] = self
        
        await self.accept()
        
        pending = InviteConsumer.pending_invites.get(self.username, [])
        for invite in pending:
            await self.send_json(invite)
            
    async def disconnect(self, code):
        if self.username in InviteConsumer.active_connections:
            del InviteConsumer.active_connections[self.username]
            
        if self.username in InviteConsumer.pending_invites:
            del InviteConsumer.pending_invites[self.username]

    async def receive_json(self, content):
        msg_type = content.get('type')
        
        if msg_type == 'send_invite':
            await self.handle_send_invite(content)
        elif msg_type == 'accept_invite':
            await self.handle_accept_invite(content)
        elif msg_type == 'decline_invite':
            await self.handle_decline_invite(content)
        elif msg_type == 'tournament_request':
            await self.handle_tournament_request(content)

    async def handle_tournament_request(self, content):
        target_username = content.get('target_username')
                
        target_connection = InviteConsumer.active_connections.get(target_username)
            
        tournament_data = {
            'type': 'tournament_request',
            'from_username': self.username,
            'timestamp': time.time()
        }
            
        if target_connection:
            await target_connection.send_json(tournament_data)
            await self.send_json({
                'type': 'tournament_request_sent',
               'target_username': target_username
            })
        else:
            if target_username not in InviteConsumer.pending_invites:
                InviteConsumer.pending_invites[target_username] = []
            InviteConsumer.pending_invites[target_username].append(tournament_data)
                
            await self.send_json({
                'type': 'tournament_request_pending',
                'message': f'User {target_username} is offline. Request will be delivered when they connect.',
                'target_username': target_username
            })
    

    async def handle_send_invite(self, content):
        print(content)
        target_username = content.get('target_username')
        game_type = content.get('game_type', 'pong')
        
        if target_username == self.username:
            await self.send_json({
                'type': 'invite_error',
                'message': 'Cannot invite yourself'
            })
            return
            
        target_connection = InviteConsumer.active_connections.get(target_username)
        
        invite_data = {
            'type': 'game_invite',
            'from_username': self.username,
            'game_type': game_type,
            'timestamp': time.time()
        }
        
        if target_connection:
            await target_connection.send_json(invite_data)
        else:
            if target_username not in InviteConsumer.pending_invites:
                InviteConsumer.pending_invites[target_username] = []
            InviteConsumer.pending_invites[target_username].append(invite_data)
            
        await self.send_json({
            'type': 'invite_sent',
            'target_username': target_username
        })

    async def handle_accept_invite(self, content):
        from_username = content.get('from_username')
        inviter_connection = InviteConsumer.active_connections.get(from_username)

        
        if not inviter_connection:
            await self.send_json({
                'type': 'invite_error',
                'message': 'Inviter is no longer online'
            })
            return

        player1 = self.scope['user']
        player2 = inviter_connection.scope['user']
            
        if player1 == player2:
            await self.send_json({
                'type': 'invite_error',
                'message': 'Cannot invite yourself'
            })
            return
        match = await sync_to_async(Match.objects.create)(
            player1=self.scope['user'],
            player2=inviter_connection.scope['user'],
            game_type=content.get('game_type', 'pong'),
            status="ongoing"
        )
        
        match_data = {
            'type': 'invite_accepted',
            'game_id': match.id,
            'opponent': self.username,
            "player1" : player1.username,
            'game_type': match.game_type
        }
        await inviter_connection.send_json(match_data)
        
        await self.send_json({
            **match_data,
            'opponent': from_username
        })

    async def handle_decline_invite(self, content):
        from_username = content.get('from_username')
        inviter_connection = InviteConsumer.active_connections.get(from_username)
        
        if inviter_connection:
            await inviter_connection.send_json({
                'type': 'invite_declined',
                'by_username': self.username
            })