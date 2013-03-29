#!/bin/bash

export AWS_REGION=eu-west-1
export AWS_AZ=eu-west-1a
export AWS_INSTANCE=i-82e0b0c8

SNAPSHOT_SIZE=8
SNAPSHOT_ID=snap-a9d92082
DEVICE=/dev/sdo

MOUNTED_VOLUME=$(ec2-describe-instances $AWS_INSTANCE | grep $DEVICE | awk '{print $3}');

function detach {
	echo "Already attached - detaching $1 and deleting"

    ec2-detach-volume $1 -i $AWS_INSTANCE

    while ec2-describe-instances $AWS_INSTANCE | grep -q $1; do
        echo "Still detaching"
        sleep 1
    done

    ec2-delete-volume $1;
}

if [ ! -z $MOUNTED_VOLUME ]; then
	detach $MOUNTED_VOLUME
fi

read volumeId <<< $(node create-volume.js --snapshotSize $SNAPSHOT_SIZE --snapshotId $SNAPSHOT_ID --device $DEVICE);

if ec2-describe-instances $AWS_INSTANCE | grep $DEVICE | grep true; then
	echo "Attached $volumeId. DeleteOnTermination set to true";
else
	echo "Failure";
fi

# detach $volumeId