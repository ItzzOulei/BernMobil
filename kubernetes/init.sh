#!/bin/bash
set -e

echo "========================================"
echo "Uploading and Loading Initial Dump to Kubernetes"
echo "========================================"

# Find the dump file locally
DUMP_FILE=$(ls ../dump/*.dump 2>/dev/null | head -n 1)

if [ -z "$DUMP_FILE" ]; then
    echo "No .dump file found in ../dump directory!"
    exit 1
fi

echo "Found dump: $DUMP_FILE"

# The Helm release name
RELEASE_NAME="my-neo4j"
PVC_NAME="datavolume-${RELEASE_NAME}-neo4j-cluster-core-0"

echo "Scaling Neo4j core down to 0 to safely load the database..."
kubectl scale statefulset ${RELEASE_NAME}-neo4j-cluster-core --replicas=0
sleep 5

# Create a temporary pods to load the data into the PVC
echo "Spinning up temporary loader pod..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: dump-loader
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
EOF

# Wait for pod to be ready
kubectl wait --for=condition=Ready pod/dump-loader --timeout=60s

echo "Transferring dump file into Kubernetes volume..."
kubectl cp "$DUMP_FILE" dump-loader:/data/neo4j.dump

echo "Running neo4j-admin database load..."
kubectl exec dump-loader -- neo4j-admin database load neo4j --from-path=/data/neo4j.dump --overwrite-destination=true

echo "Cleaning up temp pod..."
kubectl delete pod dump-loader

echo "Scaling Neo4j core back up to 3..."
kubectl scale statefulset ${RELEASE_NAME}-neo4j-cluster-core --replicas=3

echo "========================================"
echo "Dump loaded into Kubernetes cluster successfully!"
echo "========================================"
