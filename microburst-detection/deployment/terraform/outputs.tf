output "namespace" {
  description = "Kubernetes namespace name"
  value       = kubernetes_namespace.microburst.metadata[0].name
}

output "deployment_name" {
  description = "Deployment name"
  value       = kubernetes_deployment.microburst.metadata[0].name
}

output "service_name" {
  description = "Service name"
  value       = kubernetes_service.microburst.metadata[0].name
}

output "service_endpoint" {
  description = "Service endpoint"
  value       = "${kubernetes_service.microburst.metadata[0].name}.${kubernetes_namespace.microburst.metadata[0].name}.svc.cluster.local"
}

output "hpa_name" {
  description = "Horizontal Pod Autoscaler name"
  value       = kubernetes_horizontal_pod_autoscaler_v2.microburst.metadata[0].name
}

