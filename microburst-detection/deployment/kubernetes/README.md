# Kubernetes Deployment

## Prerequisites

- Kubernetes cluster (1.20+)
- kubectl configured
- Docker image pushed to registry

## Quick Deploy

```bash
# Apply all resources
kubectl apply -f deployment/kubernetes/

# Or apply individually
kubectl apply -f deployment/kubernetes/configmap.yaml
kubectl apply -f deployment/kubernetes/deployment.yaml
kubectl apply -f deployment/kubernetes/service.yaml
kubectl apply -f deployment/kubernetes/hpa.yaml
kubectl apply -f deployment/kubernetes/ingress.yaml
```

## Verify Deployment

```bash
# Check pods
kubectl get pods -l app=microburst-detection

# Check services
kubectl get svc microburst-detection

# Check ingress
kubectl get ingress microburst-detection-ingress

# View logs
kubectl logs -f deployment/microburst-detection
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment microburst-detection --replicas=5
```

### Automatic Scaling (HPA)

The HorizontalPodAutoscaler automatically scales based on CPU and memory usage:
- Min replicas: 3
- Max replicas: 10
- CPU target: 70%
- Memory target: 80%

## Configuration

### Update ConfigMap

```bash
# Edit config
kubectl edit configmap microburst-config

# Or apply new config
kubectl apply -f deployment/kubernetes/configmap.yaml

# Restart pods to apply changes
kubectl rollout restart deployment microburst-detection
```

### Environment Variables

Edit `configmap.yaml` or set directly in `deployment.yaml`.

## Monitoring

### Health Checks

The deployment includes:
- **Liveness probe**: `/health` endpoint, checks every 10s
- **Readiness probe**: `/health` endpoint, checks every 5s

### Metrics

If Prometheus is installed, metrics are available at `/metrics` (if enabled).

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name>

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

### Image Pull Errors

```bash
# Ensure image is in registry
docker push <registry>/microburst-detection:latest

# Update imagePullSecrets if using private registry
```

### Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints microburst-detection

# Port forward for testing
kubectl port-forward svc/microburst-detection 8000:80
```

## Customization

### Resource Limits

Edit `deployment.yaml` to adjust CPU/memory requests and limits.

### Replica Count

Change `spec.replicas` in `deployment.yaml` or use HPA.

### Ingress

Modify `ingress.yaml` for your domain and TLS configuration.

