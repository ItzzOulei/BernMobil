# init.ps1
$ErrorActionPreference = "Stop"

Write-Host "========================================"
Write-Host "Uploading and Loading Initial Dump to Kubernetes"
Write-Host "========================================"

# Find the dump file locally
$dumpFile = Get-ChildItem -Path "..\dump\*.dump" | Select-Object -First 1

if (-not $dumpFile) {
    Write-Host "No .dump file found in ..\dump directory!"
    exit 1
}

Write-Host "Found dump: $($dumpFile.FullName)"

$RELEASE_NAME = "my-neo4j"
$NAMESPACE = "bernmobil"
$PVC_NAME = "datavolume-${RELEASE_NAME}-neo4j-cluster-core-0"

Write-Host "Scaling Neo4j core down to 0 to safely load the database..."
kubectl scale statefulset ${RELEASE_NAME}-neo4j-cluster-core --replicas=0 -n ${NAMESPACE}
Start-Sleep -Seconds 5

Write-Host "Spinning up temporary loader pod..."
$podManifest = @"
apiVersion: v1
kind: Pod
metadata:
  name: dump-loader
  namespace: ${NAMESPACE}
spec:
  containers:
  - name: loader
    image: neo4j:enterprise
    command: ["/bin/bash", "-c", "echo 'Ready...' && sleep 3600"]
    volumeMounts:
    - name: data
      mountPath: /data
    env:
    - name: NEO4J_ACCEPT_LICENSE_AGREEMENT
      value: "yes"
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: ${PVC_NAME}
"@

$podManifest | kubectl apply -n ${NAMESPACE} -f -

Write-Host "Waiting for pod to be ready..."
kubectl wait --for=condition=Ready pod/dump-loader --timeout=60s -n ${NAMESPACE}

Write-Host "Transferring dump file into Kubernetes volume..."
kubectl cp $($dumpFile.FullName) "${NAMESPACE}/dump-loader:/data/neo4j.dump"

Write-Host "Running neo4j-admin database load..."
kubectl exec dump-loader -n ${NAMESPACE} -- neo4j-admin database load neo4j --from-path=/data/neo4j.dump --overwrite-destination=true

Write-Host "Cleaning up temp pod..."
kubectl delete pod dump-loader -n ${NAMESPACE}

Write-Host "Scaling Neo4j core back up to 3..."
kubectl scale statefulset ${RELEASE_NAME}-neo4j-cluster-core --replicas=3 -n ${NAMESPACE}

Write-Host "========================================"
Write-Host "Dump loaded into Kubernetes cluster successfully!"
Write-Host "========================================"
