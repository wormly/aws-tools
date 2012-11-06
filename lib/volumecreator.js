
var async = require('async');
var path = require('path');

module.exports = VolumeCreator;

function VolumeCreator(ec2, instancedata, fs) {
	this._ec2 = ec2;
	this._instanceData = instancedata;
	this._fs = fs;
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
		}, function (err) {
			if (err) {
				return callback(err.Body.ErrorResponse);
			} else {
				this.watch(options.device, callback);
			}
		}.bind(this));
	}.bind(this));
};

VolumeCreator.prototype.watch = function(device, callback) {
	var regexp = new RegExp('(s|xv)'+device.substr(-2));

	console.log("Waiting for the volume to attach");

	var watcher = this._fs.watch(path.dirname(device), function(event, filename) {
		if (regexp.test(filename)) {
			watcher.close();

			callback(null, "Attached");
		}
	});
};