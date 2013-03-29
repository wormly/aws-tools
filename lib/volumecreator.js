
var async = require('async');
var path = require('path');

module.exports = VolumeCreator;

function VolumeCreator(ec2) {
	this._ec2 = ec2;
}

VolumeCreator.prototype.createVolume = function(options, callback) {
	this._ec2.createVolume({
		Size: options.snapshotSize,
		SnapshotId: options.snapshotId,
		AvailabilityZone: options.zone
	}, function (err, data) {
		if (err) return callback(err);

		options.volumeId = data.VolumeId;

		setTimeout(function() {
			console.log("Waiting for 5 seconds for the volume to get created");
			this.attachVolume(options, callback);
		}.bind(this), 5000);
	}.bind(this));
};

VolumeCreator.prototype.attachVolume = function(options, callback) {
	this._ec2.attachVolume({
		InstanceId: options.instance,
		VolumeId: options.volumeId,
		Device: options.device
	}, function (err) {
		if (err) {
			callback(err);
		} else {
			setTimeout(function() {
				console.log("Waiting for 5 seconds for the volume to get attached");
				this.makeVolumeDeletedOnTermination(options, callback);
			}.bind(this), 5000);
		}
	}.bind(this));
};

VolumeCreator.prototype.makeVolumeDeletedOnTermination = function(options, callback) {
	this._ec2.modifyInstanceAttribute({
		InstanceId: options.instance,
		BlockDeviceMappings: [
			{
				"DeviceName": options.device,
				"Ebs": {
					"DeleteOnTermination": true,
					"VolumeId": options.volumeId
				}
			}
		]
	}, function(err) {
		callback(err, options.volumeId);
	});
};