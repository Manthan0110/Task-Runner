# 🛠️ Makefile for Webhook Runner Project

# Backend (FastAPI) variables
API_DIR=api
API_VENV=$(API_DIR)/venv
PYTHON=$(API_VENV)/Scripts/python

# Frontend (React + Vite) variables
WEB_DIR=frontend

# Default target
.DEFAULT_GOAL := help

# ========================
# Backend tasks
# ========================

backend-install: ## Install backend dependencies
	python -m venv $(API_VENV)
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r $(API_DIR)/requirements.txt

backend-run: ## Run FastAPI backend (with auto-reload)
	cd $(API_DIR) && $(PYTHON) -m uvicorn main:app --reload

backend-test: ## Run backend tests with pytest
	cd $(API_DIR) && $(PYTHON) -m pytest -v

backend-seed: ## Seed backend DB with fake tasks/runs
	cd $(API_DIR) && $(PYTHON) seed.py

# ========================
# Frontend tasks
# ========================

frontend-install: ## Install frontend dependencies
	cd $(WEB_DIR) && npm install

frontend-dev: ## Run frontend (Vite dev server)
	cd $(WEB_DIR) && npm run dev

frontend-build: ## Build frontend for production
	cd $(WEB_DIR) && npm run build

frontend-test: ## Run frontend tests (Vitest)
	cd $(WEB_DIR) && npm run test

# ========================
# Combined tasks
# ========================

install: backend-install frontend-install ## Install both backend & frontend

dev: ## Run both backend + frontend in parallel
	@echo "🚀 Starting backend + frontend..."
	@cd $(API_DIR) && $(PYTHON) -m uvicorn main:app --reload & \
	cd $(WEB_DIR) && npm run dev

test: backend-test frontend-test ## Run all tests

# ========================
# Help
# ========================
help: ## Show available commands
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
