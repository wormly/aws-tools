
var async = require('async');
var path = require('path');

module.exports = VolumeCreator;

function VolumeCreator(ec2) {
	this._ec2 = ec2;
}

function report(err, operation, request, callback) {
	err.operation = operation;
	err.request = request;
	callback(err);
}

VolumeCreator.prototype.createVolume = function(options, callback) {
	var request = {
		Size: options.snapshotSize,
		AvailabilityZone: options.zone
	};

	if (options.snapshotId) {
		request.SnapshotId = options.snapshotId;
	}

	this._ec2.createVolume(request, function (err, data) {
		if (err) return report(err, 'createVolume', request, callback);

		options.volumeId = data.VolumeId;

		this.attachVolume(options, callback);
	}.bind(this));
};

VolumeCreator.prototype.attachVolume = function(options, callback) {
	var request = {
		InstanceId: options.instance,
		VolumeId: options.volumeId,
		Device: options.device
	};

	this._ec2.attachVolume(request, function (err) {
		if (err) return report(err, 'attachVolume', request, callback);

		var testAttached = function() {
			this.isAttached(options, function(attached) {
				if (attached) {
					this.makeVolumeDeletedOnTermination(options, callback);
				} else {
					setTimeout(testAttached, 5000);
				}
			}.bind(this));
		}.bind(this);

		testAttached();
	}.bind(this));
};

VolumeCreator.prototype.isAttached = function(options, callback) {
	var request = {
		InstanceId: options.instance,
		Attribute: "blockDeviceMapping"
	};

	this._ec2.describeInstanceAttribute(request, function(err, data) {
		if (err) {
			report(err, 'describeInstanceAttribute', request, function(err) {
				console.error(err);
			});

			callback(false);
		} else {
			var attached = false;

			data.BlockDeviceMappings.forEach(function(device) {
				if (device.DeviceName != options.device) return;

				attached = device.Ebs.Status === 'attached';
			});

			callback(attached);
		}
	});
};

VolumeCreator.prototype.makeVolumeDeletedOnTermination = function(options, callback) {
	var request = {
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
	};

	this._ec2.modifyInstanceAttribute(request, function(err) {
		if (err) return report(err, 'modifyInstanceAttribute', request, callback);

		callback(null, options.volumeId);
	});
};