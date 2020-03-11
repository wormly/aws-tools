#!/bin/bash -e

LETTER=$1
mountPoint=$2
NAME=$3

# Also accepts some environment variables for optional parameters:
# EBS_VOLUME_TYPE=[gp2 | standard]		- specify the EBS volume type to create
# EBS_MOUNT_OPTONS=[..]				- specify additional mount-time options

EBS_VOLUME_TYPE=${EBS_VOLUME_TYPE:=gp2}
EBS_MOUNT_OPTONS=${EBS_MOUNT_OPTONS:=""}

if [[ -z "$LETTER" || -z "$mountPoint" || -z "$NAME" ]]; then
	echo Usage: mount_from_snapshot.sh n /mountpoint \"some-snapshot-name\" - will attach the latest volume matching
	echo ^some-snapshot-name.* on /dev/sdn, and mount it on /mountpoint
	exit 1
fi

source ./update-env.sh

deviceName="/dev/sd$LETTER"

if [ -b $deviceName ]; then
	echo "$deviceName already exists";
else
	read snapshotId snapshotSize <<< $(node get-latest-snapshot.js --regexp "$NAME");
	[ ! -z "$FORCE_SNAPSHOT_SIZE" ] && echo "Forcing snapshot size to $FORCE_SNAPSHOT_SIZE" && snapshotSize=$FORCE_SNAPSHOT_SIZE;
	read VOLUME_ID <<< $(node create-volume.js --snapshotSize $snapshotSize --snapshotId $snapshotId --device $deviceName --volumeType $EBS_VOLUME_TYPE)

	if [[ $VOLUME_TAG ]]; then
		aws ec2 create-tags --resources $VOLUME_ID --region $AWS_REGION --tags Key=Name,Value=$NAME Key=$VOLUME_TAG,Value=true
	fi

	while [ ! -b $deviceName ]; do
		echo "Waiting for $deviceName to appear"
		sleep 1
	done

	echo "Created $deviceName from $snapshotId"
fi

if [ ! -d $mountPoint ]; then
	mkdir $mountPoint;
else
	echo "$mountPoint already exists"
fi

# try mount if not mounted yet

if [ ! -z "$NOMOUNT" ]; then
	echo "Told not to mount. Exiting"
	exit 0
fi

started=`date +%s`

while [ true ]; do
	now=`date +%s`
	passed=$(( $now - $started ))

	if (( "$passed" > 60 )); then
		logger -s "Trying to mount $deviceName to $mountPoint for $passed seconds, halting"
		halt
	fi

	if grep -qs "$mountPoint" /proc/mounts; then
		echo "Mounted $deviceName on $mountPoint"
		break;
	fi

	mount $EBS_MOUNT_OPTONS $deviceName $mountPoint;

	sleep 2;
done