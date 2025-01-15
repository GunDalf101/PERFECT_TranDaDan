up: build
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

build:
	grep '^VITE_' .env > nginx/frontend/.env
	docker compose build

stop:
	docker compose stop

clean:
	docker system prune -af
	docker volume prune -f
	docker network prune -f
