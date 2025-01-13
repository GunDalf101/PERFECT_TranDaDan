# cause merge issue
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import UserRelationship, RelationshipType
from django.db.utils import IntegrityError
from django.utils.crypto import get_random_string
from notifs.models import Notification

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with 3 users and establishes friendships between them.'

    def handle(self, *args, **kwargs):
        try:
            confirmation = input("Are you sure you want to delete all users? This action cannot be undone (yes/no): ")

            if confirmation.lower() == 'yes':
                deleted_count, _ = User.objects.all().delete()
                self.stdout.write(self.style.SUCCESS(f'Successfully deleted {deleted_count} users.'))
            else:
                self.stdout.write(self.style.WARNING('Action cancelled. No users were deleted.'))
            first_user = User.objects.create_user(email='first@example.com', username='first', tournament_alias='first', password='first', email_verified=True)
            second_user = User.objects.create_user(email='second@example.com', username='second', tournament_alias='second', password='second', email_verified=True)
            third_user = User.objects.create_user(email='third@example.com', username='third', tournament_alias='third', password='third', email_verified=True)
            first_user.email_token = second_user.email_token = third_user.email_token = get_random_string(32)
            first_user.save()
            second_user.save()
            third_user.save()
            self.stdout.write(self.style.SUCCESS('Successfully created 3 users'))
            # for i in range(50):
            #     user = User.objects.create_user(email=f'user{i}@example.com', username=f'user{i}', tournament_alias=f'user{i}', password=f'user{i}', email_verified=True)
            #     self.stdout.write(self.style.SUCCESS(f'Successfully created user{i}'))
            #     user.email_token = None
            #     user.save()


            # Create friendships (relationships)
            self.create_friendship(first_user, second_user)
            self.create_friendship(second_user, third_user)
            self.create_friendship(first_user, third_user)

            self.stdout.write(self.style.SUCCESS('Successfully created friendships between the users'))

            self.add_notifications_for_user(first_user)
        except IntegrityError:
            self.stdout.write(self.style.ERROR('Error: Users already exist or relationships cannot be created'))

    def create_friendship(self, user1, user2):
        relationship, created = UserRelationship.objects.get_or_create(
            first_user=user1,
            second_user=user2,
            defaults={'type': RelationshipType.FRIENDS.value}
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Successfully created a friendship between {user1.username} and {user2.username}'))
        else:
            self.stdout.write(self.style.WARNING(f'Friendship between {user1.username} and {user2.username} already exists'))

    def create_friendship(self, user1, user2):
        relationship, created = UserRelationship.objects.get_or_create(
            first_user=user1,
            second_user=user2,
            defaults={'type': RelationshipType.FRIENDS.value}
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Successfully created a friendship between {user1.username} and {user2.username}'))
        else:
            self.stdout.write(self.style.WARNING(f'Friendship between {user1.username} and {user2.username} already exists'))

    def add_notifications_for_user(self, user):
        # Add some example notifications for the first user
        notifications = [
            {"content": "You have a new friend request from second@example.com.", "url": "/friend-requests"},
            {"content": "Your profile has been updated successfully.", "url": "/profile"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},

            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "A new message from third@example.com.", "url": "/messages"},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
            {"content": "Just an alert notification, no link.", "url": None},
        ]

        for notification in notifications:
            Notification.objects.create(
                user=user,
                content=notification['content'],
                url=notification['url']
            )

        self.stdout.write(self.style.SUCCESS(f'Successfully created notifications for {user.username}'))
