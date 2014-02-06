#!/bin/bash

export AWS_INSTANCE=i-8508e8ca
export AWS_REGION=eu-west-1
export AWS_EIP=54.195.250.16

echo "Mapping IP $AWS_EIP to instance $AWS_INSTANCE"

if ec2-describe-addresses | grep -q $AWS_INSTANCE; then
	echo "Already mapped - unmapping"
	ec2-disassociate-address $AWS_EIP
fi

node remapeip.js --ip $AWS_EIP --instance $AWS_INSTANCE

if ec2-describe-addresses | grep -q $AWS_INSTANCE; then
	echo "Mapped";
	exit 0
else
	echo "Failure - not mapped"
	exit 1
fi