# Terraform Deployment

## Overview

Terraform configuration for deploying Microburst Detection System to Kubernetes.

## Prerequisites

- Terraform >= 1.0
- kubectl configured
- Kubernetes cluster access
- Docker image in registry

## Configuration

### 1. Update Variables

Edit `terraform.tfvars` or set environment variables:

```hcl
environment = "production"
image_registry = "your-registry.io"
image_tag = "v1.0.0"
replicas = 3
```

### 2. Configure Backend (Optional)

Uncomment and configure backend in `main.tf`:

```hcl
backend "s3" {
  bucket = "your-terraform-state-bucket"
  key    = "microburst-detection/terraform.tfstate"
  region = "us-east-1"
}
```

### 3. Configure Providers

Update provider configuration in `main.tf` for your cluster.

## Deployment

### Initialize

```bash
terraform init
```

### Plan

```bash
terraform plan
```

### Apply

```bash
terraform apply
```

### Destroy

```bash
terraform destroy
```

## Customization

### Environment-Specific Configs

Create separate `.tfvars` files:

```bash
# terraform.tfvars.production
environment = "production"
replicas = 5
min_replicas = 3
max_replicas = 10

# terraform.tfvars.staging
environment = "staging"
replicas = 2
min_replicas = 2
max_replicas = 5
```

Apply with:

```bash
terraform apply -var-file="terraform.tfvars.production"
```

## Outputs

After deployment, view outputs:

```bash
terraform output
```

## State Management

### Remote State

Use remote state backend (S3, GCS, Azure) for team collaboration.

### State Locking

Configure DynamoDB table for state locking (AWS) or equivalent.

## Best Practices

1. **Version Control**: Never commit `.tfstate` files
2. **State Backend**: Use remote state for production
3. **Variables**: Use `.tfvars` files for environment-specific configs
4. **Modules**: Consider breaking into modules for reusability
5. **Workspaces**: Use Terraform workspaces for multiple environments

## Troubleshooting

### Provider Issues

```bash
# Reinitialize providers
terraform init -upgrade
```

### State Issues

```bash
# Refresh state
terraform refresh

# Import existing resources
terraform import <resource_type>.<name> <resource_id>
```

