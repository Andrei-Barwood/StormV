variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "production"
}

variable "app_version" {
  description = "Application version"
  type        = string
  default     = "v1"
}

variable "image_registry" {
  description = "Docker image registry"
  type        = string
  default     = "your-registry.io"
}

variable "image_tag" {
  description = "Docker image tag"
  type        = string
  default     = "latest"
}

variable "replicas" {
  description = "Number of replicas"
  type        = number
  default     = 3
}

variable "min_replicas" {
  description = "Minimum number of replicas for HPA"
  type        = number
  default     = 3
}

variable "max_replicas" {
  description = "Maximum number of replicas for HPA"
  type        = number
  default     = 10
}

variable "cpu_request" {
  description = "CPU request per pod"
  type        = string
  default     = "250m"
}

variable "cpu_limit" {
  description = "CPU limit per pod"
  type        = string
  default     = "500m"
}

variable "memory_request" {
  description = "Memory request per pod"
  type        = string
  default     = "256Mi"
}

variable "memory_limit" {
  description = "Memory limit per pod"
  type        = string
  default     = "512Mi"
}

variable "service_type" {
  description = "Kubernetes service type"
  type        = string
  default     = "LoadBalancer"
}

variable "log_level" {
  description = "Logging level"
  type        = string
  default     = "INFO"
}

variable "workers" {
  description = "Number of worker processes"
  type        = string
  default     = "4"
}

variable "wind_shear_threshold" {
  description = "Wind shear detection threshold (m/s)"
  type        = string
  default     = "3.0"
}

variable "reflectivity_threshold" {
  description = "Reflectivity detection threshold (dBZ)"
  type        = string
  default     = "40.0"
}

variable "confidence_threshold" {
  description = "Confidence threshold for detections"
  type        = string
  default     = "0.75"
}

variable "allowed_origins" {
  description = "Comma-separated list of allowed CORS origins"
  type        = string
  default     = "https://yourdomain.com"
}

