FROM python:3.11-slim

LABEL maintainer="team@microburstdetection.com"
LABEL description="Microburst Detection System - Aviation Safety"

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libhdf5-dev \
    netcdf-bin \
    libnetcdf-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY pyproject.toml .
COPY README.md .
COPY src/ ./src/

# Install Python dependencies
RUN pip install --no-cache-dir -e ".[prod]"

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 mbuser && chown -R mbuser:mbuser /app
USER mbuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["microburst-detect", "server", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
