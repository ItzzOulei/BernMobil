#!/bin/bash
# Neo4j 5 Docker Extension Script
# This runs before the Neo4j database process starts.

# Check if the database 'neo4j' already exists
if [ ! -d "/data/databases/neo4j" ]; then
    echo "========================================"
    echo "Loading initial database dump..."
    echo "========================================"
    
    # Neo4j 5 expects the dump file to be named <database.name>.dump (e.g., neo4j.dump)
    # We will find the first .dump file in /dump and copy it to a temporary location as neo4j.dump
    DUMP_FILE=$(ls /dump/*.dump 2>/dev/null | head -n 1)
    
    if [ -n "$DUMP_FILE" ]; then
        echo "Found dump file: $DUMP_FILE"
        mkdir -p /tmp/dump
        cp "$DUMP_FILE" /tmp/dump/neo4j.dump
        
        # In Neo4j 5, the command is 'neo4j-admin database load dbname --from-path=/folder'
        neo4j-admin database load neo4j --from-path=/tmp/dump --overwrite-destination=true
        
        # Clean up
        rm -rf /tmp/dump
        echo "========================================"
        echo "Dump loading completed."
        echo "========================================"
    else
        echo "No .dump file found in /dump directory. Skipping load."
    fi
else
    echo "Database 'neo4j' already exists. Skipping dump load."
fi
