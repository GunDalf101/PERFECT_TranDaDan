from .models import ChatRoom, Message

class ChatController:
    @staticmethod
    def get_chat_rooms():
        return ChatRoom.objects.all()

    @staticmethod
    def get_messages_for_room(room_id):
        return Message.objects.filter(chat_room_id=room_id).order_by('sender')

    @staticmethod
    def send_message(room_id, user, content):
        chat_room = ChatRoom.objects.get(chat_room_id=room_id)
        return Message.objects.create(chat_room=chat_room, sender=user, content=content)