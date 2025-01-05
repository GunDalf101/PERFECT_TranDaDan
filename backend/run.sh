docker pull postgres:latest

docker container stop postgres-db
docker container rm postgres-db
docker run -d \
  --name postgres-db \
  -e POSTGRES_USER=myuser \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  postgres:latest

docker pull redis:latest

docker container stop redis-db
docker container rm redis-db
docker run -d \
  --name redis-db \
  -p 6379:6379 \
  redis:latest

rm db.sqlite3

python manage.py makemigrations
python manage.py migrate

echo "!!!!! Run in another terminal: 'python manage.py process_tasks' to receive emails. !!!!!"
export DJANGO_SETTINGS_MODULE=transcendence.settings
python manage.py runserver 8000