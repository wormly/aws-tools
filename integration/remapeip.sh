export AWS_INSTANCE=i-be93c5f4
export AWS_REGION=eu-west-1
export AWS_EIP=79.125.110.186

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