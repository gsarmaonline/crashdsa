.PHONY: up down restart rebuild

up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

rebuild:
	docker compose down && docker compose build && docker compose up -d
