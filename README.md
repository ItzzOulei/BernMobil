# Neo4j Cluster

This project contains configurations for running a highly available Neo4j 5 Enterprise cluster. You can run the cluster either using **Docker Compose** (for local development/testing) or **Kubernetes** (for automatic scaling based on read traffic).

## Method 1: Docker Compose (Local & Static)

The `docker-compose.yaml` file defines a static 3-node core cluster. This is ideal for local development where you don't need automatic scaling.

### Prerequisites
- Docker & Docker Compose installed

### Running the Cluster
1. Navigate to the project root:
   ```bash
   cd neo4j-cluster
   ```
2. Start the cluster:
   ```bash
   docker-compose up -d
   ```
3. Access the Neo4j Browser:
   - Core 1: http://localhost:7474
   - Core 2: http://localhost:7475
   - Core 3: http://localhost:7476
   - **Credentials:** Username: `neo4j`, Password: `bernmobil123`

To shut down the cluster:
```bash
docker-compose down
```

---

## Method 2: Kubernetes (Auto-Scaling "Magic")

The `kubernetes/` directory contains manifests to deploy the Neo4j cluster onto Kubernetes. This setup uses the official Neo4j Helm chart and includes a **Horizontal Pod Autoscaler (HPA)** that will automatically spin up Read Replicas as your traffic increases.

### Prerequisites
- A running Kubernetes cluster (e.g., Docker Desktop Kubernetes, Minikube, or a cloud provider)
- `kubectl` installed and configured to point to your cluster
- `helm` installed (version 3+)

### Running the Cluster
1. Navigate to the kubernetes directory:
   ```bash
   cd kubernetes
   ```
2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```
   *This script adds the Neo4j Helm repo, applies the Cluster Secrets, installs the Helm chart, and sets up the HPA.*

3. Monitor the scaling:
   ```bash
   kubectl get pods -w
   ```
   You will initially see the 3 Core pods spinning up, plus 1 Read Replica pod. As the CPU utilization on the Read Replica exceeds 70%, the cluster will automatically spawn more Read Replicas (up to 10) to handle the load!

To uninstall from Kubernetes:
```bash
helm uninstall my-neo4j
kubectl delete -f hpa.yaml
kubectl delete -f neo4j-secret.yaml
```

---

## Users and Access Control

The database has been pre-configured with following users (`password: b3rnm0bil`):

| Benutzer | Rolle | Berechtigung |
|----------|-------|-------------|
| `administrator` | `admin` | Voller Zugriff auf System und Daten. |
| `backup_admin` | `admin` | Voller Zugriff auf System und Daten. |
| `app_user` | `reader` | Dieser User nutzt unsere WebApp. Er hat nur Leserechte. |
| `netzplaner` | `editor` | Darf den Graphen lesen und modifizieren, jedoch keine Systemeinstellungen ändern. |
