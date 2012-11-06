
var async = require('async');

module.exports = VolumeCreator;

function VolumeCreator(ec2, instancedata) {
	this._ec2 = ec2;
	this._instanceData = instancedata;
}

VolumeCreator.prototype.createVolume = function(options, callback) {
	this._instanceData.getAvailabilityZone(function(err, zone) {
		if (err) return callback(err);

		this._ec2.CreateVolume({
			Size: options.snapshotSize,
			SnapshotId: options.snapshotId,
			AvailabilityZone: zone
		}, function (err, data) {
			if (err) return callback(err.Body.ErrorResponse);

			var id = data.Body.CreateVolumeResponse.volumeId;

			options.volumeId = id;

			this.attachVolume(options, callback);
		}.bind(this));
	}.bind(this));
};

VolumeCreator.prototype.attachVolume = function(options, callback) {
	this._instanceData.getInstanceId(function(err, instanceId) {
		if (err) return callback(err);

		this._ec2.AttachVolume({
			InstanceId: instanceId,
			VolumeId: options.volumeId,
			Device: options.device
		}, function (err, data) {
			if (err) {
				return callback(err.Body.ErrorResponse);
			} else {
				callback(null, data.Body.AttachVolumeResponse);
			}
		}.bind(this));
	}.bind(this));
};
