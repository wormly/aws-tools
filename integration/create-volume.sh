#!/bin/bash

SNAPSHOT_SIZE=1
SNAPSHOT_ID=snap-8ab72873
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
	echo "Failure $volumeId";
	exit 1
fi

aws ec2 create-snapshot --volume-id $volumeId --description "integ-delete-me"