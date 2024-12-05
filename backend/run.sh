docker pull postgres:latest

docker run -d \
  --name postgres-db \
  -e POSTGRES_USER=myuser \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  postgres:latest

python manage.py makemigrations
python manage.py migrate

echo "!!!!! Run in another terminal: 'python manage.py process_tasks' to receive emails. !!!!!"

python manage.py runserver 80



