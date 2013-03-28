#!/bin/bash

export AWS_REGION=eu-west-1

# This will always update existing record normally. Delete it in advance to test how it is created.

export TEST_IP=$(( $RANDOM % 255 )).$(( $RANDOM % 255 )).$(( $RANDOM % 255 )).$(( $RANDOM % 255 ))
export TEST_DNS=integration-test.dev.worm.ly

echo "Updating $TEST_DNS to $TEST_IP"

node update-dns-ip.js --ip $TEST_IP --name $TEST_DNS --ttl 60

# todo: tested manually so far, since there are no api tools for route53?