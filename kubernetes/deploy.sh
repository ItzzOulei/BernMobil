#!/bin/bash
set -e

echo "🚀 Starting Kubernetes Magic Migration for Neo4j..."

echo "🏗  Creating Namespace 'bernmobil'..."
kubectl create namespace bernmobil || true

# 1. Add Neo4j Helm Repository
echo "📦 Adding Neo4j Helm repository..."
helm repo add neo4j https://helm.neo4j.com/neo4j
helm repo update

# 2. Apply Secrets
echo "🔑 Applying Neo4j Secrets..."
kubectl apply -f neo4j-secret.yaml -n bernmobil

# 3. Install Neo4j Cluster via Helm
echo "⛵ Installing Neo4j Cluster Core & Read Replicas..."
helm upgrade --install my-neo4j neo4j/neo4j -f values.yaml -n bernmobil

# 4. Apply Horizontal Pod Autoscaler for Read Replicas
echo "📈 Applying Horizontal Pod Autoscaler (HPA)..."
kubectl apply -f hpa.yaml -n bernmobil

echo ""
echo "✨ Cluster Deployment Started!"
echo "👉 Once running, your Read Replicas will automatically scale out and in between 1 and 10 nodes depending on traffic/CPU load!"

echo "⏳ Waiting for the Neo4j Core database to become ready (this may take a minute)..."
kubectl wait --for=condition=Ready pod/my-neo4j-0 -n bernmobil --timeout=300s

echo "🔌 Forwarding Neo4j HTTP port local 7474..."
kubectl port-forward svc/my-neo4j 7474:7474 -n bernmobil > /dev/null 2>&1 &
PORT_FORWARD_PID=$!

echo "🌐 Opening Neo4j Browser automatically..."
sleep 3
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:7474
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:7474
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    start http://localhost:7474
else
    echo "Please open http://localhost:7474 manually in your browser."
fi

echo "👉 Note: Port forwarding is running in the background (PID $PORT_FORWARD_PID)."
echo "When you want to stop it, run: kill $PORT_FORWARD_PID"
