import asyncio
import websockets
import json
import sys
import requests
import getpass
import curses
import time
from typing import Optional, Dict
from dataclasses import dataclass

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

@dataclass
class KeyState:
    pressed: bool
    last_update: float

class KeyboardHandler:
    def __init__(self):
        self.keys: Dict[str, KeyState] = {
            'up': KeyState(pressed=False, last_update=0),
            'down': KeyState(pressed=False, last_update=0)
        }
        self.input_buffer = []
        self.last_sent = 0
        self.input_rate = 1/60
        
    async def handle_input(self, stdscr):
        """Handle keyboard input with improved responsiveness"""
        while True:
            try:
                key = stdscr.getch()
                current_time = asyncio.get_event_loop().time()
                
                if key == curses.KEY_UP:
                    if not self.keys['up'].pressed:
                        self.keys['up'].pressed = True
                        self.keys['up'].last_update = current_time
                        self.keys['down'].pressed = False
                elif key == curses.KEY_DOWN:
                    if not self.keys['down'].pressed:
                        self.keys['down'].pressed = True
                        self.keys['down'].last_update = current_time
                        self.keys['up'].pressed = False
                elif key == -1:
                    for key_state in self.keys.values():
                        if key_state.pressed and current_time - key_state.last_update > 0.05:
                            key_state.pressed = False
                
            except Exception:
                pass
            
            await asyncio.sleep(0.001)
    
    async def send_input(self, websocket):
        """Send buffered input commands at a controlled rate"""
        while True:
            current_time = asyncio.get_event_loop().time()
            
            if current_time - self.last_sent >= self.input_rate:
                if self.keys['up'].pressed:
                    await websocket.send(json.dumps({
                        "type": "player_input",
                        "input": "up"
                    }))
                elif self.keys['down'].pressed:
                    await websocket.send(json.dumps({
                        "type": "player_input",
                        "input": "down"
                    }))
                self.last_sent = current_time
            
            await asyncio.sleep(self.input_rate)

class PongCLI:
    def __init__(self, api_url: str, ws_url: str):
        self.api_url = api_url
        self.ws_url = ws_url
        self.access_token = None
        self.game_session: Optional[GameSession] = None
        self.matchmaking_ws = None
        self.game_ws = None
        self.keyboard_handler = KeyboardHandler()
        self.stdscr = None
        self.game_window = None
        
    def init_curses(self):
        """Initialize curses settings"""
        self.stdscr = curses.initscr()
        curses.noecho()
        curses.cbreak()
        curses.start_color()
        curses.init_pair(1, curses.COLOR_BLUE, curses.COLOR_BLACK)
        curses.init_pair(2, curses.COLOR_RED, curses.COLOR_BLACK)
        curses.init_pair(3, curses.COLOR_WHITE, curses.COLOR_BLACK)
        self.stdscr.keypad(True)
        self.stdscr.nodelay(1)
        curses.curs_set(0)

    def cleanup_curses(self):
        """Clean up curses settings"""
        if self.stdscr:
            self.stdscr.keypad(False)
            curses.nocbreak()
            curses.echo()
            curses.endwin()

    async def login(self):
        """Handle user login"""
        self.cleanup_curses()
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
            self.init_curses()
            return True
            
        except requests.RequestException as e:
            print(f"\nLogin failed: {str(e)}")
            self.init_curses()
            return False

    async def find_match(self):
        """Connect to matchmaking and find a game"""
        self.stdscr.clear()
        self.stdscr.addstr(0, 0, "Searching for a match...")
        self.stdscr.refresh()
        
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
                        self.stdscr.addstr(2, 0, f"Match found! Playing against: {self.game_session.opponent}")
                        self.stdscr.refresh()
                        
                        for i in range(3, 0, -1):
                            self.stdscr.addstr(3, 0, f"Game starting in {i}...")
                            self.stdscr.refresh()
                            await asyncio.sleep(1)
                        return True
                        
                    elif response.get("status") == "error":
                        self.stdscr.addstr(2, 0, f"Matchmaking error: {response.get('message')}")
                        self.stdscr.refresh()
                        await asyncio.sleep(2)
                        return False
                        
        except websockets.exceptions.WebSocketException as e:
            self.stdscr.addstr(2, 0, f"Matchmaking connection error: {str(e)}")
            self.stdscr.refresh()
            await asyncio.sleep(2)
            return False

    async def render_game_state(self, state):
        """Render the current game state in a fixed 80x22 area"""
        FIXED_WIDTH = 80
        FIXED_HEIGHT = 22
        
        scale_x = FIXED_WIDTH / GAME_WIDTH
        scale_y = (FIXED_HEIGHT - 4) / GAME_HEIGHT
        
        GAME_START_Y = 2
        
        self.stdscr.clear()
        
        player1 = self.game_session.username if self.game_session.is_player1 else self.game_session.opponent
        player2 = self.game_session.opponent if self.game_session.is_player1 else self.game_session.username
        score_str = f"{player1}: {state['score1']} | {player2}: {state['score2']}"
        self.stdscr.addstr(0, (FIXED_WIDTH - len(score_str)) // 2, score_str)
        
        for y in range(FIXED_HEIGHT - 4):
            self.stdscr.addch(y + GAME_START_Y, 0, '│', curses.color_pair(3))
            self.stdscr.addch(y + GAME_START_Y, FIXED_WIDTH - 1, '│', curses.color_pair(3))

        center_x = FIXED_WIDTH // 2
        for y in range(FIXED_HEIGHT - 4):
            if y % 2 == 0:
                self.stdscr.addch(y + GAME_START_Y, center_x, '┊', curses.color_pair(3))
        
        paddle1_x = int(50 * scale_x)
        paddle1_y = GAME_START_Y + int(state['paddle1Y'] * scale_y)
        paddle2_x = int((GAME_WIDTH - 50) * scale_x)
        paddle2_y = GAME_START_Y + int(state['paddle2Y'] * scale_y)
        
        paddle_height = max(1, int(PADDLE_HEIGHT * scale_y))
        for i in range(paddle_height):
            if 0 <= paddle1_y + i < GAME_START_Y + FIXED_HEIGHT - 4:
                self.stdscr.addch(paddle1_y + i, paddle1_x, '█', curses.color_pair(1))
            if 0 <= paddle2_y + i < GAME_START_Y + FIXED_HEIGHT - 4:
                self.stdscr.addch(paddle2_y + i, paddle2_x, '█', curses.color_pair(2))
        
        ball_x = int(state['ballX'] * scale_x)
        ball_y = GAME_START_Y + int(state['ballY'] * scale_y)
        if (GAME_START_Y <= ball_y < GAME_START_Y + FIXED_HEIGHT - 4 and 
            0 <= ball_x < FIXED_WIDTH):
            self.stdscr.addch(ball_y, ball_x, '●', curses.color_pair(3))
        
        if not state['gameStarted']:
            status = "Waiting for opponent... (Use ↑↓ keys to move)"
            self.stdscr.addstr(FIXED_HEIGHT - 1, (FIXED_WIDTH - len(status)) // 2, status)
        
        self.stdscr.refresh()

    async def play_game(self):
        """Handle the main game loop"""
        if not self.game_session:
            self.stdscr.addstr(0, 0, "No active game session!")
            self.stdscr.refresh()
            await asyncio.sleep(2)
            return

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

                keyboard_task = asyncio.create_task(
                    self.keyboard_handler.handle_input(self.stdscr)
                )
                input_task = asyncio.create_task(
                    self.keyboard_handler.send_input(websocket)
                )
                
                try:
                    while True:
                        response = json.loads(await websocket.recv())
                        
                        if response["type"] == "game_state":
                            await self.render_game_state(response["state"])
                        elif response["type"] == "game_ended":
                            winner = response["winner"]
                            is_winner = winner == self.game_session.username
                            self.stdscr.clear()
                            self.stdscr.addstr(0, 0, f"Game Over! {'You won!' if is_winner else f'{winner} won!'}")
                            self.stdscr.refresh()
                            await asyncio.sleep(2)
                            keyboard_task.cancel()
                            input_task.cancel()
                            break
                        elif response["type"] == "player_disconnected":
                            self.stdscr.addstr(0, 0, f"{response['player']} disconnected! Waiting for reconnection...")
                            self.stdscr.refresh()
                            
                except asyncio.CancelledError:
                    keyboard_task.cancel()
                    input_task.cancel()
                    raise
                    
        except websockets.exceptions.WebSocketException as e:
            self.stdscr.addstr(0, 0, f"Game connection error: {str(e)}")
            self.stdscr.refresh()
            await asyncio.sleep(2)

    async def run(self):
        """Main application loop"""
        try:
            self.init_curses()
            
            if not await self.login():
                return

            while True:
                self.stdscr.clear()
                self.stdscr.addstr(0, 0, "1. Find Match")
                self.stdscr.addstr(1, 0, "2. Quit")
                self.stdscr.addstr(3, 0, "Enter your choice (1-2): ")
                self.stdscr.refresh()
                
                curses.echo()
                self.stdscr.nodelay(0)
                
                choice = self.stdscr.getstr().decode('utf-8')
                
                curses.noecho()
                self.stdscr.nodelay(1)
                
                if choice == '1':
                    if await self.find_match():
                        await self.play_game()
                elif choice == '2':
                    break
                else:
                    self.stdscr.addstr(4, 0, "Invalid choice!")
                    self.stdscr.refresh()
                    await asyncio.sleep(1)

        except KeyboardInterrupt:
            pass
        finally:
            self.cleanup_curses()
            if self.matchmaking_ws:
                await self.matchmaking_ws.close()
            if self.game_ws:
                await self.game_ws.close()

if __name__ == "__main__":
    api_url = "http://localhost:8000"
    ws_url = "ws://localhost:8000"
    
    if len(sys.argv) > 1:
        api_url = sys.argv[1]
        ws_url = sys.argv[1].replace('http', 'ws')
    
    client = PongCLI(api_url, ws_url)
    asyncio.run(client.run())