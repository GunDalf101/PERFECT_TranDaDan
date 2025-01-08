

# docker stop postgres-db
# docker rm -f postgres-db
# docker pull postgres:latest
# docker stop postgres-db
# docker rm -f postgres-db
# docker pull postgres:latest

# docker container rm postgres-db
# docker run -d \
#   --name postgres-db \
#   -e POSTGRES_USER=myuser \
#   -e POSTGRES_PASSWORD=mypassword \
#   -e POSTGRES_DB=mydb \
#   -p 5432:5432 \
#   postgres:latest
# docker container rm postgres-db
# docker run -d \
#   --name postgres-db \
#   -e POSTGRES_USER=myuser \
#   -e POSTGRES_PASSWORD=mypassword \
#   -e POSTGRES_DB=mydb \
#   -p 5432:5432 \
#   postgres:latest


# docker pull redis:latest

# docker container rm redis-db
# docker run -d \
#   --name redis-db \
#   -p 6379:6379 \
#   redis:latest

# docker start postgres-db
# docker start redis-db

# sleep 10
python3 manage.py makemigrations
python3 manage.py migrate

echo "!!!!! Run in another terminal: 'python manage.py process_tasks' to receive emails. !!!!!"
export DJANGO_SETTINGS_MODULE=transcendence.settings
python manage.py runserver 8000