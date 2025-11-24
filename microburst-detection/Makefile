.PHONY: help install dev test lint format clean docker-build docker-run

help:
	@echo "Microburst Detection System - Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  install       - Install production dependencies"
	@echo "  dev           - Install development dependencies"
	@echo "  test          - Run test suite"
	@echo "  lint          - Run linters (ruff, mypy)"
	@echo "  format        - Format code with black"
	@echo "  clean         - Remove build artifacts"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-run    - Run Docker container"
	@echo "  serve         - Start development server"

install:
	pip install -e .

dev:
	pip install -e ".[dev,ml,viz]"

test:
	pytest tests/ -v --cov=src/microburst_detection --cov-report=html

lint:
	ruff check src/ tests/
	mypy src/

format:
	black src/ tests/
	ruff check --fix src/ tests/

clean:
	rm -rf build/ dist/ *.egg-info
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache/ .coverage htmlcov/

docker-build:
	docker build -t microburst-detection:latest .

docker-run:
	docker run -p 8000:8000 microburst-detection:latest

serve:
	microburst-detect server --reload --port 8000
