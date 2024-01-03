#!/usr/bin/env bash

# This script is used to quickly profile the major
pnpm build

echo "Starting nodejs in the background..."
NODE_ENV=production pnpm run profile &
background_pid=$!

echo "Background pid for nodejs process: $background_pid"
echo "Waiting a few seconds for nodejs to start..."
sleep 5

echo "Running k6 tests..."
k6 run k6/publish.js

echo "Killing nodejs process running in $background_pid..."
kill $background_pid

echo "Generating tick files..."
# If current directory is tests then we need to go up one level
if [[ $(basename $(pwd)) == "tests" ]]; then
  echo "Current directory is tests, going up one level..."
  cd ..
fi

#node --prof-process --preprocess -j isolate*.log > processed.txt
node --prof-process isolate*.log > processed.txt
