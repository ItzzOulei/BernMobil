#!/bin/bash
set -e

echo "🚀 Starting Kubernetes Magic Migration for Neo4j..."

# 1. Add Neo4j Helm Repository
echo "📦 Adding Neo4j Helm repository..."
helm repo add neo4j https://helm.neo4j.com/neo4j
helm repo update

# 2. Apply Secrets
echo "🔑 Applying Neo4j Secrets..."
kubectl apply -f neo4j-secret.yaml

# 3. Install Neo4j Cluster via Helm
echo "⛵ Installing Neo4j Cluster Core & Read Replicas..."
helm upgrade --install my-neo4j neo4j/neo4j -f values.yaml

# 4. Apply Horizontal Pod Autoscaler for Read Replicas
echo "📈 Applying Horizontal Pod Autoscaler (HPA)..."
kubectl apply -f hpa.yaml

echo ""
echo "✨ Cluster Deployment Started!"
echo "👉 Run 'kubectl get pods -w' to watch the nodes spin up."
echo "👉 Once running, your Read Replicas will automatically scale out and in between 1 and 10 nodes depending on traffic/CPU load!"
