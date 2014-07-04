#!/bin/bash

node delete-snapshots.js

# snapshots are now not regexp based
# REMAINING=$( aws ec2 describe-snapshots --filters "Name=description,Values=integ-delete-me" --output text )
# 
#if [ ! -z "$REMAINING" ]; then
	#echo "Found a snapshot that should have been deleted"
	#echo $REMAINING
	#exit 1
#fi

