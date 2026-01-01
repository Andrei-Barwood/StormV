terraform {
  required_version = ">= 1.0"
  
  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }
  
  # Backend configuration (uncomment and configure)
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "microburst-detection/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "kubernetes" {
  # Configure based on your cluster
  # config_path = "~/.kube/config"
  # config_context = "your-context"
}

provider "helm" {
  # Configure based on your cluster
  # kubernetes {
  #   config_path = "~/.kube/config"
  # }
}

# Namespace
resource "kubernetes_namespace" "microburst" {
  metadata {
    name = "microburst-detection"
    labels = {
      app = "microburst-detection"
    }
  }
}

# ConfigMap
resource "kubernetes_config_map" "microburst_config" {
  metadata {
    name      = "microburst-config"
    namespace = kubernetes_namespace.microburst.metadata[0].name
    labels = {
      app = "microburst-detection"
    }
  }

  data = {
    ENVIRONMENT                = var.environment
    LOG_LEVEL                  = var.log_level
    SERVER_HOST                = "0.0.0.0"
    SERVER_PORT                = "8000"
    WORKERS                    = var.workers
    WIND_SHEAR_THRESHOLD_MS    = var.wind_shear_threshold
    REFLECTIVITY_THRESHOLD_DBZ = var.reflectivity_threshold
    CONFIDENCE_THRESHOLD       = var.confidence_threshold
    ALLOWED_ORIGINS            = var.allowed_origins
  }
}

# Deployment
resource "kubernetes_deployment" "microburst" {
  metadata {
    name      = "microburst-detection"
    namespace = kubernetes_namespace.microburst.metadata[0].name
    labels = {
      app     = "microburst-detection"
      version = var.app_version
    }
  }

  spec {
    replicas = var.replicas

    selector {
      matchLabels = {
        app = "microburst-detection"
      }
    }

    template {
      metadata {
        labels = {
          app     = "microburst-detection"
          version = var.app_version
        }
      }

      spec {
        container {
          name  = "microburst-detection"
          image = "${var.image_registry}/microburst-detection:${var.image_tag}"

          port {
            container_port = 8000
            name          = "http"
            protocol      = "TCP"
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map.microburst_config.metadata[0].name
            }
          }

          resources {
            requests = {
              cpu    = var.cpu_request
              memory = var.memory_request
            }
            limits = {
              cpu    = var.cpu_limit
              memory = var.memory_limit
            }
          }

          liveness_probe {
            http_get {
              path = "/health"
              port = 8000
            }
            initial_delay_seconds = 30
            period_seconds       = 10
            timeout_seconds      = 5
            failure_threshold    = 3
          }

          readiness_probe {
            http_get {
              path = "/health"
              port = 8000
            }
            initial_delay_seconds = 10
            period_seconds       = 5
            timeout_seconds      = 3
            failure_threshold    = 3
          }
        }
      }
    }
  }
}

# Service
resource "kubernetes_service" "microburst" {
  metadata {
    name      = "microburst-detection"
    namespace = kubernetes_namespace.microburst.metadata[0].name
    labels = {
      app = "microburst-detection"
    }
  }

  spec {
    type = var.service_type

    port {
      port        = 80
      target_port = 8000
      protocol    = "TCP"
      name        = "http"
    }

    selector = {
      app = "microburst-detection"
    }

    session_affinity = "ClientIP"
  }
}

# Horizontal Pod Autoscaler
resource "kubernetes_horizontal_pod_autoscaler_v2" "microburst" {
  metadata {
    name      = "microburst-detection-hpa"
    namespace = kubernetes_namespace.microburst.metadata[0].name
    labels = {
      app = "microburst-detection"
    }
  }

  spec {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.microburst.metadata[0].name
    }

    metric {
      type = "Resource"
      resource {
        name = "cpu"
        target {
          type                = "Utilization"
          average_utilization = 70
        }
      }
    }

    metric {
      type = "Resource"
      resource {
        name = "memory"
        target {
          type                = "Utilization"
          average_utilization = 80
        }
      }
    }
  }
}

