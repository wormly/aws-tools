#!/bin/bash

export AWS_REGION=eu-west-1
export AWS_EIP=$( aws ec2 allocate-address --query "PublicIp" --output text )

echo "Mapping IP $AWS_EIP to instance $AWS_INSTANCE"

# 2>/dev/null to fix warning when null instance id is converted to text
assignedTo=$( aws ec2 describe-addresses --public-ips $AWS_EIP \
 --query "Addresses[0].InstanceId" --output text 2>/dev/null )

echo "Now assigned to $assignedTo"

if [ "$assignedTo" == "$AWS_INSTANCE" ]; then
	echo "Already mapped - unmapping"
	aws ec2 disassociate-address --public-ip $AWS_EIP --output text
fi

echo "Remaping"
node remapeip.js --ip $AWS_EIP --instance $AWS_INSTANCE

assignedTo=$( aws ec2 describe-addresses --public-ips $AWS_EIP \
 --query "Addresses[0].InstanceId" --output text 2>/dev/null )

echo -n "Disassociating "; aws ec2 disassociate-address --public-ip $AWS_EIP --output text
echo -n "Releasing "; aws ec2 release-address --public-ip $AWS_EIP --output text

if [ "$assignedTo" == "$AWS_INSTANCE" ]; then
	echo "Mapped";
else
	echo "Failure - not mapped"
	exit 1
fi