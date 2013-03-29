
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

		this.attachVolume(options, callback);
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
			this.makeVolumeDeletedOnTermination(options, callback);
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