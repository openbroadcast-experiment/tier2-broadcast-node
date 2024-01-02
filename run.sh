#!/bin/sh

# Script to run against EC2 instances to bootstrap them
# Run as root
sudo yum update
sudo yum install -y git docker
sudo usermod -a -G docker ec2-user

wget https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)
sudo mv docker-compose-$(uname -s)-$(uname -m) /usr/local/bin/docker-compose
sudo chmod -v +x /usr/local/bin/docker-compose

sudo systemctl start docker.service
sudo systemctl enable docker.service

