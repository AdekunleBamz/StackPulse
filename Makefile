# StackPulse Makefile
# Common development tasks

.PHONY: help install dev server frontend test test:server test:fe lint clean docker-build docker-up docker-down

help:
	@echo "StackPulse Development Commands"
	@echo "================================"
	@echo "install      - Install all dependencies"
	@echo "dev          - Run development servers"
	@echo "server       - Run server only"
	@echo "frontend     - Run frontend only"
	@echo "test         - Run all tests"
	@echo "test:server  - Run server tests"
	@echo "test:fe      - Run frontend tests"
	@echo "lint         - Run linting"
	@echo "clean        - Clean build artifacts"
	@echo "docker-build - Build Docker containers"
	@echo "docker-up    - Start Docker containers"
	@echo "docker-down  - Stop Docker containers"

install:
	cd server && npm install --legacy-peer-deps
	cd frontend && npm install --legacy-peer-deps
	npm install --legacy-peer-deps

dev:
	npm run dev:all

server:
	cd server && npm run dev

frontend:
	cd frontend && npm run dev

test:
	npm test

test:server:
	cd server && npm test

test:fe:
	cd frontend && npm test

lint:
	cd server && npm run lint
	cd frontend && npm run lint

clean:
	cd server && npm run clean
	cd frontend && npm run clean
	rm -rf node_modules

docker-build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
