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
  -e DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/node_storage \
  -e TIER1_ENDPOINT=/ip4/127.0.0.1/tcp/5001/p2p/16Uiu2HAmNVi4vHffVoakQoiFYMuimoYvN23cxFvGjT1FibHRyx37 \
  -e TIER1_DID=did:pkh:eip155:1:0x90F79bf6EB2c4f870365E785982E1f101E93b906 \
  -e USER_DID=did:pkh:eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  -e LIBP2P_PRIVATE_KEY=CAISIGfqjWbopTq5/0qwnzRI3rpWpQzvNGxgs2MCHyhOZmZT \
  -e LIBP2P_PUBLIC_KEY=CAISIQItZvtcRbkVNMwWLBjgoxNFm7DImzdMw1o6kp+ApD6gCw== \
  jidotaikasuru/tier2-publish-node:latest