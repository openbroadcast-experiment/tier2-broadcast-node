#!/bin/bash
# This is what CI calls to redeploy the container
# This restarts the container if you run it a second time

CONTAINER_NAME="publish-node"
# Check if the container is running
if [ "$(docker ps -q -f name=^/${CONTAINER_NAME}$)" ]; then
    echo "Container ${CONTAINER_NAME} is running. Stopping it now..."
    docker stop "${CONTAINER_NAME}"
else
    echo "Container ${CONTAINER_NAME} is not running."
fi

docker image pull jidotaikasuru/tier2-publish-node:latest
docker run -d --rm \
  --name publish_node -p 8080:8080 \
  -e PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  -e MY_ENDPOINT=http://localhost:8080/ \
  -e REST_API_PORT=8080 \
  -e LIBP2P_PORT=4002 \
  jidotaikasuru/tier2-publish-node:latest