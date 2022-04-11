#!/bin/bash

sudo yum -y install docker jq git &>/dev/null

sudo service docker start
sudo git clone https://github.com/cd-athena/wondershaper.git /home/ec2-user/wondershaper

config=$(cat /home/ec2-user/config.json)
player=$(echo "$config" | jq -r '.player')

sudo docker pull babakt/cmcd-ppt-client:latest &>/dev/null
sudo docker run --rm -d --name "cmcd-ppt-client-$player" -p 5900:5900 -v /dev/shm:/dev/shm babakt/cmcd-ppt-client

sudo docker cp /home/ec2-user/config.json "cmcd-ppt-client-$player:/home/seluser/ppt/config.json"
sudo docker exec -d "cmcd-ppt-client-$player" sudo pm2 start index.js

exit 0
