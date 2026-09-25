#!/bin/bash
set -e

echo "=========================================="
echo " Building and Loading Docker Images       "
echo "=========================================="

# Build and load backend
echo "-> Building backend image..."
docker build -t appointment_system-backend:latest ./backend
echo "-> Loading backend image into kind cluster..."
kind load docker-image appointment_system-backend:latest --name $(kind get clusters | head -n 1)

# Build and load frontend
echo "-> Building frontend image..."
docker build -t appointment_system-frontend:latest ./frontend
echo "-> Loading frontend image into kind cluster..."
kind load docker-image appointment_system-frontend:latest --name $(kind get clusters | head -n 1)

echo "=========================================="
echo " Restarting Deployments                   "
echo "=========================================="

kubectl rollout restart deployment appointment-system-backend -n appointment-system
kubectl rollout restart deployment appointment-system-frontend -n appointment-system

echo "=========================================="
echo " Done! Kubernetes will now pull the fresh "
echo " images.                                  "
echo "=========================================="
