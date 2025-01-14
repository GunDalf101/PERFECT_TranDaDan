from django.contrib.auth import get_user_model
import threading

class PlayersManager:
    _players = []
    _lock = threading.Lock()

    @classmethod
    def add_player(cls, username):
        with cls._lock:
            cls._players.append(username)

    @classmethod
    def remove_player(cls, username):
        with cls._lock:
            cls._players.remove(username)

    @classmethod
    def player_exists(cls, username):
        with cls._lock:
            return username in cls._players