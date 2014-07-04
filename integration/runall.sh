#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export AWS_REGION=eu-west-1
export AWS_AZ=eu-west-1c

previd=$( aws ec2 describe-instances --filters "Name=tag:type,Values=awstoolstest" \
 --output text --query "Reservations[0].Instances[0].InstanceId" )

if [ ! -z "$previd" ]; then
	echo Deleting instance $previd with tag awstoolstest
	aws ec2 terminate-instances --instance-ids $previd --output text
fi

export AWS_INSTANCE=$( aws ec2 run-instances --image-id ami-672ce210 --instance-type t1.micro \
 --query 'Instances[0].InstanceId' --output text --placement AvailabilityZone=$AWS_AZ )
 
echo "instance id $AWS_INSTANCE . Sleeping 60 secs for instance to start"

sleep 60

aws ec2 create-tags --resources $AWS_INSTANCE --tags Key=type,Value=awstoolstest --output text

$DIR/create-volume.sh

$DIR/get-latest-snapshot.sh

$DIR/delete-snapshots.sh

$DIR/remapeip.sh

$DIR/update-dns-ip.sh


aws ec2 terminate-instances --instance-ids $AWS_INSTANCE --output text