# Deployment Guide

## Overview

This guide covers deployment options for the Microburst Detection System in production environments.

## Docker Deployment

### Build Image

```bash
docker build -t microburst-detection:latest .
```

### Run Container

```bash
docker run -d \
  --name microburst-detection \
  -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e LOG_LEVEL=INFO \
  microburst-detection:latest
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Kubernetes Deployment

See `deployment/kubernetes/` for complete Kubernetes manifests.

### Quick Deploy

```bash
# Apply all resources
kubectl apply -f deployment/kubernetes/

# Check status
kubectl get pods -l app=microburst-detection

# View logs
kubectl logs -f deployment/microburst-detection
```

### Scaling

```bash
# Scale deployment
kubectl scale deployment microburst-detection --replicas=3
```

## Cloud Provider Deployments

### AWS (ECS/EKS)

1. Build and push to ECR:
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker tag microburst-detection:latest <account>.dkr.ecr.<region>.amazonaws.com/microburst-detection:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/microburst-detection:latest
```

2. Deploy using ECS task definition or EKS deployment manifests.

### Google Cloud (GKE)

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/<project-id>/microburst-detection

# Deploy to GKE
kubectl apply -f deployment/kubernetes/
```

### Azure (AKS)

```bash
# Build and push to ACR
az acr build --registry <registry-name> --image microburst-detection:latest .

# Deploy to AKS
kubectl apply -f deployment/kubernetes/
```

## Environment Variables

Configure using environment variables or `.env` file:

```bash
# Environment
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
WORKERS=4

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Detection Thresholds
WIND_SHEAR_THRESHOLD_MS=3.0
REFLECTIVITY_THRESHOLD_DBZ=40.0
CONFIDENCE_THRESHOLD=0.75

# Database (optional)
DATABASE_URL=postgresql://user:pass@localhost/microburst

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
PROMETHEUS_PORT=9090
```

## Production Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Configure proper CORS origins
- [ ] Set up database for persistence (optional)
- [ ] Configure logging aggregation
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure SSL/TLS certificates
- [ ] Set up reverse proxy (nginx/traefik)
- [ ] Configure rate limiting
- [ ] Set up backup strategy
- [ ] Configure health checks
- [ ] Set resource limits (CPU/memory)
- [ ] Configure auto-scaling

## Monitoring

### Health Checks

The `/health` endpoint should be monitored:

```bash
# Kubernetes liveness probe
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
```

### Metrics

Prometheus metrics available at `/metrics` (if enabled).

### Logging

Structured JSON logs are output to stdout. Configure log aggregation:
- ELK Stack
- CloudWatch (AWS)
- Stackdriver (GCP)
- Application Insights (Azure)

## High Availability

### Load Balancing

Use a load balancer (nginx, HAProxy, cloud LB) with multiple instances:

```yaml
# Kubernetes service
apiVersion: v1
kind: Service
metadata:
  name: microburst-detection
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8000
  selector:
    app: microburst-detection
```

### Database Persistence

For production, use a persistent database:

```python
# PostgreSQL example
DATABASE_URL=postgresql://user:pass@db-host:5432/microburst
```

## Security

- Use HTTPS/TLS in production
- Implement API authentication (API keys, OAuth2)
- Configure firewall rules
- Use secrets management (Kubernetes secrets, AWS Secrets Manager)
- Regular security updates
- Rate limiting
- Input validation (already implemented with Pydantic)

## Backup and Recovery

- Database backups (if using database)
- Configuration backups
- Detection history exports

## Troubleshooting

### Check Logs

```bash
# Docker
docker logs microburst-detection

# Kubernetes
kubectl logs deployment/microburst-detection

# Systemd
journalctl -u microburst-detection -f
```

### Common Issues

1. **Port already in use**: Change `SERVER_PORT` or stop conflicting service
2. **Memory issues**: Increase container memory limits
3. **Slow responses**: Scale horizontally or increase workers
4. **Database connection**: Verify `DATABASE_URL` and network connectivity

