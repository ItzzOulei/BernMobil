# Neo4j Cluster (Kubernetes)

This project contains the configuration for running a highly available Neo4j 5 Enterprise cluster specifically on **Kubernetes** utilizing the official Neo4j Helm charts. It automatically scales Read Replicas based on traffic and comes with a script to populate your database with an initial dump.

## Prerequisites
- A running Kubernetes cluster (Docker Desktop, Minikube, EKS, etc.)
- `kubectl` configured
- `helm` installed (v3+)

## 1. Deploy the Cluster

Navigate to the `kubernetes/` directory and run the deployment script:
```bash
cd kubernetes
./deploy.sh
```

This will:
1. Register the Neo4j Helm repository.
2. Apply the necessary Kubernetes Secrets for authentication.
3. Install the Neo4j Cluster (3 Core Nodes and 1 Read Replica initially).
4. Apply the Horizontal Pod Autoscaler (HPA) to auto-scale Read Replicas based on CPU.

You can monitor it spinning up visually:
```bash
kubectl get pods -w
```

## 2. Load the Initial Database Dump

If you have a `.dump` file located in the `/dump` directory at the project root, you can load it into your newly created Kubernetes cluster by running the init script:

```bash
cd kubernetes
./init.sh
```

**Note:** This script will safely scale down the cluster, transfer your local dump file into the Kubernetes PersistentVolume via a temporary bridge pod, extract it using `neo4j-admin`, and scale your cluster back up!

## 3. Users and Access Control

Once the database has started (and your dump is loaded), it will be configured with following users (Default password: `b3rnm0bil`):

| Benutzer | Rolle | Berechtigung |
|----------|-------|-------------|
| `administrator` | `admin` | Voller Zugriff auf System und Daten. |
| `backup_admin` | `admin` | Voller Zugriff auf System und Daten. |
| `app_user` | `reader` | Dieser User nutzt unsere WebApp. Er hat nur Leserechte. |
| `netzplaner` | `editor` | Darf den Graphen lesen und modifizieren, jedoch keine Systemeinstellungen ändern. |

To uninstall the cluster:
```bash
helm uninstall my-neo4j
kubectl delete -f kubernetes/hpa.yaml
kubectl delete -f kubernetes/neo4j-secret.yaml
```
