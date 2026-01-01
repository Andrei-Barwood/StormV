# Advanced Docker Deployment

## Production Docker Compose

### Quick Start

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Services

1. **microburst-detection**: Main application
2. **nginx**: Reverse proxy with SSL/TLS
3. **prometheus**: Metrics collection
4. **grafana**: Metrics visualization

## Nginx Configuration

### SSL Certificates

Place SSL certificates in `nginx/ssl/`:
- `cert.pem` - SSL certificate
- `key.pem` - SSL private key

### Generate Self-Signed Cert (Development)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/CN=api.yourdomain.com"
```

### Production SSL

Use Let's Encrypt or your CA:

```bash
# Copy certificates
cp /path/to/cert.pem nginx/ssl/
cp /path/to/key.pem nginx/ssl/
```

## Monitoring

### Prometheus

Access at `http://localhost:9090`

### Grafana

Access at `http://localhost:3000`
- Username: `admin`
- Password: `admin` (change in production!)

### Metrics Endpoint

If metrics are enabled, available at `/metrics` on the application.

## Customization

### Environment Variables

Edit `docker-compose.prod.yml` to customize:
- Worker count
- Resource limits
- Log levels
- Detection thresholds

### Resource Limits

Adjust in `deploy.resources` section:
```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
```

### Scaling

```bash
# Scale application
docker-compose -f docker-compose.prod.yml up -d --scale microburst-detection=3
```

## Health Checks

Health checks are configured for:
- Application: `/health` endpoint
- Automatic restart on failure
- Startup grace period: 40s

## Logs

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f microburst-detection
```

### Log Persistence

Logs are persisted to `./logs` directory (mounted volume).

## Backup

### Configuration Backup

```bash
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
  nginx/ssl/ \
  prometheus/ \
  grafana/
```

## Troubleshooting

### Container Not Starting

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check resources
docker stats
```

### Nginx Issues

```bash
# Test configuration
docker exec microburst-nginx nginx -t

# Reload configuration
docker exec microburst-nginx nginx -s reload
```

### SSL Issues

```bash
# Verify certificates
openssl x509 -in nginx/ssl/cert.pem -text -noout
```

