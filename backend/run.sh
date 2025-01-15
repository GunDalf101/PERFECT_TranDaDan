# docker stop postgres-db
# docker container rm postgres-db
# docker run -d \
#   --name postgres-db \
#   -e POSTGRES_USER=myuser \
#   -e POSTGRES_PASSWORD=mypassword \
#   -e POSTGRES_DB=mydb \
#   -p 5432:5432 \
#   postgres:latest

# docker stop redis-db
# docker container rm redis-db
# docker run -d \
#   --name redis-db \
#   -p 6379:6379 \
#   redis:latest

export SSL_CERT_FILE=$(python3 -m certifi)
python3 manage.py makemigrations
python3 manage.py migrate
echo yes | python3 manage.py seed_users

echo "!!!!! Run in another terminal: 'export SSL_CERT_FILE=\$(python3 -m certifi); python manage.py process_tasks' to receive emails. !!!!!"
python3 manage.py process_tasks &
export DJANGO_SETTINGS_MODULE=transcendence.settings
# python manage.py runserver localhost:8000
daphne -b 0.0.0.0 -p 8000 transcendence.asgi:application
