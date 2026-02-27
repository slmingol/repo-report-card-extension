# Fix for Issue #6: Inefficient Docker Build Process

## Problem
The argocdApplicationLinter currently builds from source on **every single run**, adding 2-5+ minutes to each CI/CD pipeline execution. This wastes GitHub Actions minutes and slows developer feedback.

## Solution
Publish pre-built Docker images to GitHub Container Registry (GHCR) and use those instead of building from source.

---

## Implementation Steps

### Step 1: Add GitHub Actions Workflow to Build and Publish Images

Create `.github/workflows/build-argocd-linter.yml`:

```yaml
name: Build ArgoCD Linter Image

on:
  push:
    branches:
      - main
    paths:
      - 'argocdApplicationLinter/**'
      - '.github/workflows/build-argocd-linter.yml'
  pull_request:
    paths:
      - 'argocdApplicationLinter/**'
  release:
    types: [published]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository_owner }}/argocd-application-linter

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./argocdApplicationLinter
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64
```

### Step 2: Create action.yml for the ArgoCD Linter

Create `argocdApplicationLinter/action.yml`:

```yaml
name: 'ArgoCD Application Linter'
description: 'Lints ArgoCD Application YAML files for correctness and compliance'
author: 'Bandwidth'

branding:
  icon: 'check-circle'
  color: 'blue'

inputs:
  files:
    description: 'Comma-separated list of files to lint'
    required: true
  private-repos:
    description: 'Private Helm repositories with credentials (format: url=--username user --password pass)'
    required: false
    default: ''

runs:
  using: 'docker'
  image: 'docker://ghcr.io/bandwidth/argocd-application-linter:latest'
  args:
    - ${{ inputs.files }}
    - ${{ inputs.private-repos }}
```

### Step 3: Update Documentation

Update `argocdApplicationLinter/README.md`:

```markdown
# ArgoCD Application Linter

Validates ArgoCD Application YAML files for correctness, security compliance, and best practices.

## Features

- Validates ArgoCD Application manifest structure
- Checks destination namespace permissions
- Validates Helm chart versions and availability
- Ensures prod/non-prod repository segregation
- Validates project/team alignment
- Fast execution using pre-built containers

## Usage

### Basic Usage

```yaml
name: Lint ArgoCD Applications

on:
  pull_request:
    paths:
      - 'gitops/**/*.yaml'
      - 'gitops/**/*.yml'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Get changed files
        id: changed-files
        uses: tj-actions/changed-files@v41
        with:
          files: |
            gitops/**/*.yaml
            gitops/**/*.yml

      - name: Lint ArgoCD Applications
        uses: bandwidth/bw-devops-github-actions/argocdApplicationLinter@v1
        with:
          files: ${{ steps.changed-files.outputs.all_changed_files }}
```

### With Private Helm Repositories

```yaml
      - name: Lint ArgoCD Applications
        uses: bandwidth/bw-devops-github-actions/argocdApplicationLinter@v1
        with:
          files: ${{ steps.changed-files.outputs.all_changed_files }}
          private-repos: |
            https://charts.example.com/helm=--username ${{ secrets.HELM_USER }} --password ${{ secrets.HELM_PASSWORD }}
```

## Performance

- **Pre-built images**: ~5-10 seconds startup time
- **Build from source** (old): 2-5+ minutes startup time

Pre-built images are published to GitHub Container Registry on every release.

## Validations Performed

1. **Application Structure**: Validates required fields (name, project, source, destination)
2. **Naming Convention**: Ensures DNS-compliant application names
3. **Destination Validation**: Checks namespace permissions against ArgoCD project
4. **Chart Validation**: Verifies Helm chart exists and templates correctly
5. **Environment Segregation**: Ensures snapshot repos aren't used in production
6. **Team/Project Alignment**: Validates file path matches project ownership

## Development

### Building Locally

```bash
cd argocdApplicationLinter
docker build -t argocd-linter:local .
```

### Running Tests

```bash
go test -v ./...
```

### Publishing New Versions

Images are automatically built and published when:
- Code is merged to main (tagged as `latest`)
- A new release is created (tagged with version number)

## License

Apache 2.0
```

### Step 4: Update Main Repository README

Update the main `README.md` to reflect the new usage:

```markdown
## Inventory

| Action | Description | Status |
| ------ | ----------- | ------ |
| [argocdApplicationLinter](argocdApplicationLinter) | Linter for ArgoCD YAML markup | ✅ Pre-built images |
| [artifactoryDockerPromote](artifactoryDockerPromote) | Promote docker images | - |
| [artifactoryPromote](artifactoryPromote) | Promote artifacts | - |
| [oktaAwsAuth](oktaAwsAuth) | AWS auth via Okta | - |
| [snowChangeManagement](snowChangeManagement) | Service Now integration | - |
| [goCapacityCheck](goCapacityCheck) | Cluster capacity checks | - |
```

### Step 5: (Optional) Optimize Dockerfile Further

If you want to keep the existing Dockerfile structure but optimize it:

**Optimized Dockerfile** (argocdApplicationLinter/Dockerfile):

```dockerfile
FROM golang:1.21-alpine as build

WORKDIR /build

# Copy dependency files first for better layer caching
COPY go.mod go.sum* ./
RUN go mod download || true

# Copy source code
COPY *.go ./

# Build with optimization flags
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o argocdApplicationLinter

FROM alpine/helm:3.13.2

# Install required tools
RUN apk add --no-cache ca-certificates && \
    wget -q https://github.com/mikefarah/yq/releases/download/v4.40.5/yq_linux_amd64 -O /usr/bin/yq && \
    chmod +x /usr/bin/yq && \
    wget -q https://github.com/argoproj/argo-cd/releases/download/v2.9.5/argocd-linux-amd64 -O /usr/bin/argocd && \
    chmod +x /usr/bin/argocd

# Copy binary from build stage
COPY --from=build /build/argocdApplicationLinter /go/bin/argocdApplicationLinter

ENTRYPOINT ["/go/bin/argocdApplicationLinter"]
```

---

## Migration Plan

### Phase 1: Set Up Publishing (Week 1)
1. Add the GitHub Actions workflow
2. Test the workflow on a feature branch
3. Verify images are published to GHCR
4. Test pulling and running the published image

### Phase 2: Create action.yml (Week 1)
1. Add action.yml file
2. Test using the action in a sample workflow
3. Document any issues

### Phase 3: Update Consumers (Week 2)
1. Identify all repositories using the linter
2. Update their workflows to use the new action format:
   ```yaml
   # Old (slow)
   uses: bandwidth/bw-devops-github-actions/argocdApplicationLinter@main
   
   # New (fast)
   uses: bandwidth/bw-devops-github-actions/argocdApplicationLinter@v1
   ```

### Phase 4: Monitor & Optimize (Week 3)
1. Monitor CI/CD pipeline performance improvements
2. Collect metrics on time savings
3. Document results

---

## Expected Results

### Before (Building from Source)
- Image build: ~2-3 minutes
- Dependency download: ~30-60 seconds
- Go compilation: ~30-60 seconds
- Total startup: **3-5 minutes**

### After (Pre-built Images)
- Image pull: ~5-10 seconds
- Total startup: **5-10 seconds**

### Savings
- **Time**: 95%+ reduction in startup time
- **Cost**: Significant reduction in GitHub Actions minutes
- **Developer experience**: Near-instant feedback

---

## Security Considerations

1. **Image Scanning**: Add vulnerability scanning to the build workflow:
   ```yaml
   - name: Run Trivy vulnerability scanner
     uses: aquasecurity/trivy-action@master
     with:
       image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.meta.outputs.version }}
       format: 'sarif'
       output: 'trivy-results.sarif'
   ```

2. **Image Signing**: Consider signing images with Cosign for supply chain security

3. **SBOM Generation**: Generate Software Bill of Materials for compliance

---

## Rollback Plan

If issues arise, you can always revert to building from source by:

1. Changing action.yml to use local Dockerfile:
   ```yaml
   runs:
     using: 'docker'
     image: 'Dockerfile'
   ```

2. Or users can pin to an older version/commit

---

## Testing Checklist

- [ ] GitHub Actions workflow runs successfully
- [ ] Image is published to GHCR
- [ ] Image can be pulled without authentication for public repos
- [ ] Image runs correctly with test ArgoCD manifests
- [ ] Action works in a consumer repository
- [ ] Performance improvement is measurable
- [ ] All existing validations still work
- [ ] Documentation is updated

---

## Questions?

Contact: Platform/DevOps team
Repository: https://github.com/Bandwidth/bw-devops-github-actions
