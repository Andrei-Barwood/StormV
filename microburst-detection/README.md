# Microburst Detection System

Professional aviation safety solution for detecting microbursts using LIDAR, Doppler radar, and multi-sensor fusion.

## Quick Start

```bash
# Install
pip install -e ".[dev]"

# Run tests
pytest tests/

# Start server
microburst-detect server --reload
```

## Documentation

- **[Quick Start Guide](docs/guides/QUICK_START.md)** - Get started in minutes
- **[API Documentation](docs/api/README.md)** - Complete API reference
- **[Deployment Guide](docs/guides/DEPLOYMENT.md)** - Production deployment
- **[Architecture](docs/architecture/README.md)** - System architecture
- **[Examples](docs/examples/)** - Code examples

## Deployment Options

- **[Docker](deployment/docker/README.md)** - Docker Compose with Nginx, Prometheus, Grafana
- **[Kubernetes](deployment/kubernetes/README.md)** - Complete K8s manifests with HPA
- **[Terraform](deployment/terraform/README.md)** - Infrastructure as Code

## Features

- ⚡ Real-time microburst detection (<2s latency)
- 🤖 Multi-sensor fusion (LIDAR, Doppler Radar, Anemometer)
- 🚨 Alert generation for pilots and ATC
- 📈 REST API and WebSocket streaming
- 🐳 Docker and Kubernetes ready
- 📊 Monitoring and metrics support
