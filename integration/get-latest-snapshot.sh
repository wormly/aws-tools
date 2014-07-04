#!/bin/bash

export AWS_REGION=eu-west-1

res=$( node get-latest-snapshot.js --regexp "integ-delete-me" )

echo $res

if [ -z "$res" ]; then
	echo "Could not find snapshot"
	exit 1
fi