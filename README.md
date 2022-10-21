## CMCD-enabled Adaptive Streaming Players Performance Testbed
- Evaluates CADLAD - a CMCD-Aware per-Device bitrate
ladder construction
- Execute experiments on AWS cloud 
- Configurable network attributes are
    - `duration` (seconds)
    - `serverIngress` (kbps)
    - `serverEgress` (kbps)
    - `serverLatency` (ms)
    - `clientIngress` (kbps)
    - `clientEgress` (kbps)
    - `clientLatency` (ms)
 
**Note** The combination of `bandwidth` and `latency` in one node is not allowed.


#### Requirements
- [docker](https://docs.docker.com/install/)
- [python 2.7](https://www.python.org/downloads/)
- [jq](https://stedolan.github.io/jq)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)

#### Guides
- [Configuring the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
- [Creating a Key Pair Using Amazon EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html#having-ec2-create-your-key-pair)
- [IAM Roles](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html)
- [Security Group Rules](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html)

#### Running on AWS cloud
```
./run.sh --players 10xdashjscmcdTV --title stc --shaper network/network0.json --awsKey ppt-key
```

#### Monitoring in debug mode

Copy the assigned IP address from the terminal, add `:5900` to the end of it
and try to connect with a VNC client.
Note that vnc service will be available only after initialization stage.


## Authors
* Minh Nguyen - Christian Doppler Laboratory ATHENA, Alpen-Adria-Universitaet Klagenfurt - minh.nguyen@aau.at
* Babak Taraghi - Christian Doppler Laboratory ATHENA, Alpen-Adria-Universitaet Klagenfurt - minh.nguyen@aau.at

## Citation
```
@inproceedings{nguyencadlad22,
  title={CADLAD: Device-aware Bitrate Ladder Construction for HTTP Adaptive Streaming},
  author={Nguyen, Minh and Taraghi, Babak Rahman and Bentaleb, Abdelhak and Zimmermann, Roger and Timmerer, Christian},
  booktitle={2022 18th international conference on network and service management (CNSM)},
  pages={00--01},
  year={2022},
  organization={IEEE}
}
```
