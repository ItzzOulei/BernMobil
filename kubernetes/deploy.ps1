# deploy.ps1
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Kubernetes Magic Migration for Neo4j..."

Write-Host "🏗  Creating Namespace 'bernmobil'..."
kubectl create namespace bernmobil 2>$null

Write-Host "📦 Adding Neo4j Helm repository..."
helm repo add neo4j https://helm.neo4j.com/neo4j
helm repo update

Write-Host "🔑 Applying Neo4j Secrets..."
kubectl apply -f neo4j-secret.yaml -n bernmobil

Write-Host "⛵ Installing Neo4j Cluster Core & Read Replicas..."
helm upgrade --install my-neo4j neo4j/neo4j -f values.yaml -n bernmobil

Write-Host "📈 Applying Horizontal Pod Autoscaler (HPA)..."
kubectl apply -f hpa.yaml -n bernmobil

Write-Host ""
Write-Host "✨ Cluster Deployment Started!"
Write-Host "👉 Once running, your Read Replicas will automatically scale out and in between 1 and 10 nodes depending on traffic/CPU load!"

Write-Host "⏳ Waiting for the Neo4j Core database to become ready (this may take a minute)..."
kubectl wait --for=condition=Ready pod/my-neo4j-0 -n bernmobil --timeout=300s

Write-Host "🔌 Forwarding Neo4j HTTP port local 7474..."
Start-Process -NoNewWindow -FilePath "kubectl" -ArgumentList "port-forward svc/my-neo4j 7474:7474 -n bernmobil"

Write-Host "🌐 Opening Neo4j Browser automatically..."
Start-Sleep -Seconds 3
Start-Process "http://localhost:7474"

Write-Host "👉 Note: Port forwarding is running in the background."
Write-Host "To stop it, you can close the terminal or manually kill the kubectl process."
