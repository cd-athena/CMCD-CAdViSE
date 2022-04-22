#!/bin/bash

sudo yum -y install docker jq git &>/dev/null

sudo service docker start
sudo git clone https://github.com/cd-athena/wondershaper.git /home/ec2-user/wondershaper


sudo docker pull "babakt/ppt-server:cmcd" &>/dev/null
sudo docker run --rm -d --name ppt-server -p 80:80 -v /dev/shm:/dev/shm "babakt/ppt-server:cmcd"

exit 0
