#!/bin/bash

export AWS_REGION=eu-west-1

# This will always update existing record normally. Delete it in advance to test how it is created.

export TEST_IP=$(( $RANDOM % 255 )).$(( $RANDOM % 255 )).$(( $RANDOM % 255 )).$(( $RANDOM % 255 ))
export TEST_DNS=integration-test.dev.worm.ly.
export ZONE_ID="/hostedzone/ZMR59PPAFTRE2"

currentIP=$( aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID \
 --query 'ResourceRecordSets[?Name==`'$TEST_DNS'`].ResourceRecords[0]' --output text )

echo "Current IP $currentIP"

node update-dns-ip.js --ip $TEST_IP --name $TEST_DNS --ttl 60

newIP=$( aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID \
 --query 'ResourceRecordSets[?Name==`'$TEST_DNS'`].ResourceRecords[0]' --output text )

echo "New IP $newIP"

if [ "$currentIP" == "$newIP" ]; then
	echo "Bad IP"
	exit 1
fi
