import asyncio
import websockets
import json
import sys
import os
import requests
import getpass
import time
from typing import Optional
from dataclasses import dataclass

# Constants matching the React version
GAME_WIDTH = 800
GAME_HEIGHT = 400
PADDLE_WIDTH = 15
PADDLE_HEIGHT = 80
BALL_SIZE = 10

@dataclass
class GameSession:
    game_id: str
    username: str
    opponent: str
    is_player1: bool

class PongCLI:
    def __init__(self, api_url: str, ws_url: str):
        self.api_url = api_url
        self.ws_url = ws_url
        self.access_token = None
        self.game_session: Optional[GameSession] = None
        self.matchmaking_ws = None
        self.game_ws = None
        self.keys = {'up': False, 'down': False}
        
    async def login(self):
        """Handle user login"""
        print("\n=== Pong Game Login ===")
        email = input("Email: ")
        password = getpass.getpass("Password: ")

        try:
            response = requests.post(
                f"{self.api_url}/api/login",
                json={"email": email, "password": password}
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get('mfa_required'):
                print("\nMFA verification required!")
                mfa_code = input("Enter MFA code: ")
                mfa_response = requests.post(
                    f"{self.api_url}/api/auth/verify-2fa/",
                    json={"code": mfa_code},
                    headers={"Authorization": f"Bearer {data['access_token']}"}
                )
                mfa_response.raise_for_status()
                self.access_token = mfa_response.json()['access_token']
            else:
                self.access_token = data['access_token']
                
            print("\nLogin successful!")
            return True
            
        except requests.RequestException as e:
            print(f"\nLogin failed: {str(e)}")
            return False

    async def find_match(self):
        """Connect to matchmaking and find a game"""
        print("\nSearching for a match...")
        
        try:
            ws_url = f"{self.ws_url}/ws/matchmaking/?token={self.access_token}"
            async with websockets.connect(ws_url) as websocket:
                self.matchmaking_ws = websocket
                
                await websocket.send(json.dumps({
                    "type": "find_match",
                    "game_type": "classic-pong"
                }))
                
                while True:
                    response = json.loads(await websocket.recv())
                    
                    if response.get("status") == "matched":
                        self.game_session = GameSession(
                            game_id=response["game_id"],
                            username=response["username"],
                            opponent=response["opponent"],
                            is_player1=response["username"] == response["player1"]
                        )
                        print(f"\nMatch found! Playing against: {self.game_session.opponent}")
                        print("\nGame starting in 3...")
                        await asyncio.sleep(1)
                        print("2...")
                        await asyncio.sleep(1)
                        print("1...")
                        await asyncio.sleep(1)
                        return True
                        
                    elif response.get("status") == "error":
                        print(f"\nMatchmaking error: {response.get('message')}")
                        return False
                        
        except websockets.exceptions.WebSocketException as e:
            print(f"\nMatchmaking connection error: {str(e)}")
            return False

    async def handle_keyboard(self):
        """Handle keyboard input using asyncio"""
        import sys
        import termios
        import tty
        
        def get_key():
            fd = sys.stdin.fileno()
            old_settings = termios.tcgetattr(fd)
            try:
                tty.setraw(fd)
                ch = sys.stdin.read(1)
            finally:
                termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
            return ch

        while True:
            if select.select([sys.stdin], [], [], 0)[0]:
                key = get_key()
                if key == '\x1b':  # ESC sequence
                    next1 = get_key()
                    next2 = get_key()
                    if next1 == '[':
                        if next2 == 'A':  # Up arrow
                            self.keys['up'] = True
                            self.keys['down'] = False
                        elif next2 == 'B':  # Down arrow
                            self.keys['up'] = False
                            self.keys['down'] = True
            else:
                self.keys['up'] = False
                self.keys['down'] = False
            await asyncio.sleep(1/60)  # Match the React version's input rate

    async def play_game(self):
        """Handle the main game loop"""
        if not self.game_session:
            print("No active game session!")
            return

        print("\nGame starting...")
        print("Controls: Up/Down arrow keys to move paddle")
        
        try:
            ws_url = f"{self.ws_url}/ws/classic-pong/{self.game_session.game_id}/?token={self.access_token}"
            async with websockets.connect(ws_url) as websocket:
                self.game_ws = websocket
                
                await websocket.send(json.dumps({
                    "type": "init",
                    "username": self.game_session.username,
                    "opponent": self.game_session.opponent,
                    "isPlayer1": self.game_session.is_player1
                }))

                # Start keyboard handling task
                keyboard_task = asyncio.create_task(self.handle_keyboard())
                
                # Start input sending task
                async def send_input():
                    while True:
                        if self.keys['up']:
                            await websocket.send(json.dumps({
                                "type": "player_input",
                                "input": "up"
                            }))
                        elif self.keys['down']:
                            await websocket.send(json.dumps({
                                "type": "player_input",
                                "input": "down"
                            }))
                        await asyncio.sleep(1/60)

                input_task = asyncio.create_task(send_input())
                
                try:
                    while True:
                        response = json.loads(await websocket.recv())
                        
                        if response["type"] == "game_state":
                            await self.render_game_state(response["state"])
                            
                        elif response["type"] == "game_ended":
                            winner = response["winner"]
                            is_winner = winner == self.game_session.username
                            print(f"\nGame Over! {'You won!' if is_winner else f'{winner} won!'}")
                            keyboard_task.cancel()
                            input_task.cancel()
                            break
                            
                        elif response["type"] == "player_disconnected":
                            print(f"\n{response['player']} disconnected! Waiting for reconnection...")
                            
                except asyncio.CancelledError:
                    keyboard_task.cancel()
                    input_task.cancel()
                    raise
                    
        except websockets.exceptions.WebSocketException as e:
            print(f"\nGame connection error: {str(e)}")

    async def render_game_state(self, state):
        """Render the current game state in the terminal"""
        os.system('cls' if os.name == 'nt' else 'clear')
        
        player1 = self.game_session.username if self.game_session.is_player1 else self.game_session.opponent
        player2 = self.game_session.opponent if self.game_session.is_player1 else self.game_session.username
        
        print(f"\n{player1} (Blue): {state['score1']} | {player2} (Red): {state['score2']}")
        
        width = 80
        height = 24
        
        scale_x = width / GAME_WIDTH
        scale_y = height / GAME_HEIGHT
        
        board = [[' ' for _ in range(width)] for _ in range(height)]
        
        # Center line
        for y in range(height):
            board[y][width // 2] = '┊'
        
        # Paddles
        paddle1_x = int(50 * scale_x)
        paddle1_y = int(state['paddle1Y'] * scale_y)
        paddle2_x = int((GAME_WIDTH - 50) * scale_x)
        paddle2_y = int(state['paddle2Y'] * scale_y)
        
        paddle_height = int(PADDLE_HEIGHT * scale_y)
        for i in range(paddle_height):
            if 0 <= paddle1_y + i < height:
                board[paddle1_y + i][paddle1_x] = '█'
            if 0 <= paddle2_y + i < height:
                board[paddle2_y + i][paddle2_x] = '█'
        
        # Ball
        ball_x = int(state['ballX'] * scale_x)
        ball_y = int(state['ballY'] * scale_y)
        if 0 <= ball_y < height and 0 <= ball_x < width:
            board[ball_y][ball_x] = '●'
        
        print('┌' + '─' * width + '┐')
        for row in board:
            print('│' + ''.join(row) + '│')
        print('└' + '─' * width + '┘')
        
        if not state['gameStarted']:
            print("\nWaiting for opponent...")
            print("Use ↑↓ keys to move")
        
        # # Connection status
        # status = "🟢 Connected" if self.game_ws and self.game_ws.open else "🔴 Disconnected"
        # print(f"\n{status}")

    async def run(self):
        """Main application loop"""
        try:
            if not await self.login():
                return

            while True:
                print("\n1. Find Match")
                print("2. Quit")
                
                choice = input("\nEnter your choice (1-2): ")
                
                if choice == '1':
                    if await self.find_match():
                        await self.play_game()
                elif choice == '2':
                    break
                else:
                    print("\nInvalid choice!")

        except KeyboardInterrupt:
            print("\nExiting...")
        finally:
            if self.matchmaking_ws:
                await self.matchmaking_ws.close()
            if self.game_ws:
                await self.game_ws.close()

if __name__ == "__main__":
    import select  # Added for keyboard input
    
    api_url = "http://localhost:8000" 
    ws_url = "ws://localhost:8000"
    
    client = PongCLI(api_url, ws_url)
    asyncio.run(client.run())