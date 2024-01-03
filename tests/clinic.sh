#!/bin/zsh

export PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
export MY_ENDPOINT=http://localhost:8080/
export REST_API_PORT=8080
export LIBP2P_PORT=4002
export DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/node_storage
export TIER1_ENDPOINT=/ip4/127.0.0.1/tcp/5001/p2p/16Uiu2HAmNVi4vHffVoakQoiFYMuimoYvN23cxFvGjT1FibHRyx37
export TIER1_DID=did:pkh:eip155:1:0x90F79bf6EB2c4f870365E785982E1f101E93b906
export USER_DID=did:pkh:eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
export LIBP2P_PRIVATE_KEY=CAISIGfqjWbopTq5/0qwnzRI3rpWpQzvNGxgs2MCHyhOZmZT
export LIBP2P_PUBLIC_KEY=CAISIQItZvtcRbkVNMwWLBjgoxNFm7DImzdMw1o6kp+ApD6gCw==
#clinic doctor --on-port 'k6 run ./k6/publish.js' -- node ../dist/index.js
#clinic bubbleprof --on-port 'k6 run ./k6/publish.js' -- node ../dist/index.js
clinic flame --on-port 'k6 run ./k6/publish.js' -- node ../dist/index.js
#clinic heapprofiler --on-port 'k6 run ./k6/publish.js' -- node ../dist/index.js
