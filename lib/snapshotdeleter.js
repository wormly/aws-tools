
module.exports = SnapshotDeleter;

var async = require('async');
var DAY_SIZE = 86400;
var WEEK_SIZE = 604800;

function SnapshotDeleter(ec2, dataGetter) {
	this._ec2 = ec2;
	this._dataGetter = dataGetter;
}

SnapshotDeleter.prototype.deleteSnapshotsByDescription = function(options, callback) {
	this._ec2.DescribeSnapshots({}, function(err, data) {
		if (err) return callback(err.Body.Response.Errors);

		var items = data.Body.DescribeSnapshotsResponse.snapshotSet.item;

		if (! items) { // no snapshots...
			callback();
		} else {
			items = items.filter(function(item) {
				return options.regexp.test(item.description);
			});

			this._deleteSnapshots(items, callback);
		}
	}.bind(this));
};

SnapshotDeleter.prototype.deleteSnapshotsByDevice = function(options, callback) {
	this._dataGetter.getInstanceId(function(err, instanceId) {
		if (err) return callback(err);

		this._ec2.DescribeVolumes({
			InstanceId: instanceId,
			Filter : [
				{
					Name : 'attachment.instance-id',
					Value : [ instanceId ]
				}, {
					Name : 'attachment.device',
					Value : options.device
				}
			]
		}, function(err, data) {
			if (err) return callback(err.Body.Response.Errors);

			var item = data.Body.DescribeVolumesResponse.volumeSet.item;

			if (! item) {
				callback();
			} else {
				console.log("Found volume", item.volumeId, "on device", options.device);

				this.deleteSnapshotsByVolumeId({
					volumeId: item.volumeId
				}, callback);
			}
		}.bind(this));
	}.bind(this));
};

SnapshotDeleter.prototype.deleteSnapshotsByVolumeId = function(options, callback) {
	this._ec2.DescribeSnapshots({
		Filter : [{
			Name : 'volume-id',
			Value : [ options.volumeId ]
		}]
	}, function (err, result) {
		if (err) {
			return callback(err.Body.Response);
		}

		var items = result.Body.DescribeSnapshotsResponse.snapshotSet.item;

		this._deleteSnapshots(items, callback);
	}.bind(this));
};

SnapshotDeleter.prototype._shouldDelete = function(snapshot, day, lastDay) {
	var age = Math.round(Date.now() / 1000) - new Date(snapshot.startTime) / 1000;

	if (age <= DAY_SIZE) {
		console.log("Snapshot", snapshot.snapshotId, "is from the past 24h");
		return false;
	}

	if (age > WEEK_SIZE) {
		console.log("Snapshot", snapshot.snapshotId, "is week or more old");
		return true;
	}

	if (day != lastDay) {
		console.log("Snapshot", snapshot.snapshotId, "is the last of the new day");
		return false;
	}

	return true;
};

SnapshotDeleter.prototype._deleteSnapshots = function(items, callback) {
	if (! items) { // no matching snapshots
		return callback();
	}

	var lastDay = false;

	items = items.sort(function(a, b) {
		return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
	});

	async.forEachSeries(items, function(item, itemCb) {
		var date = new Date(item.startTime);
		var day = date.getDate();

		var onEnd = function() {
			lastDay = day;
			itemCb();
		};

		if(this._shouldDelete(item, day, lastDay)) {
			console.log("Deleting", item.snapshotId);

			this._ec2.DeleteSnapshot({
				SnapshotId: item.snapshotId
			}, onEnd);
		} else {
			onEnd();
		}
	}.bind(this), callback);
};