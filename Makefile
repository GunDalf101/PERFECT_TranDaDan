up: build
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

build:
	docker-compose build

stop:
	docker-compose stop

clean:
	docker system prune -af
	docker volume rm $(shell docker volume ls -q -f name=media)
	docker volume rm $(shell docker volume ls -q -f name=postgres_data)
	docker network prune -f
