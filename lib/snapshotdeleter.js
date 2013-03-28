
module.exports = SnapshotDeleter;

var async = require('async');
var DAY_SIZE = 86400;
var WEEK_SIZE = 604800;

function SnapshotDeleter(ec2) {
	this._ec2 = ec2;
}

SnapshotDeleter.prototype.deleteSnapshotsByDescription = function(options, callback) {
	this._ec2.describeSnapshots({}, function(err, data) {
		if (err) return callback(err);

		var snapshots = data.Snapshots;

		if (! snapshots) { // no snapshots...
			callback();
		} else {
			snapshots = snapshots.filter(function(item) {
				return options.regexp.test(item.Description);
			});

			this._deleteSnapshots(snapshots, callback);
		}
	}.bind(this));
};

SnapshotDeleter.prototype._shouldDelete = function(snapshot, day, lastDay) {
	var snapshotTime = new Date(snapshot.StartTime).getTime();
	var now = Date.now();
	var age = (now - snapshotTime) / 1000;

	if (age <= DAY_SIZE) {
		console.log("Snapshot", snapshot.SnapshotId, "is from the past 24h");
		return false;
	}

	if (age > WEEK_SIZE) {
		console.log("Snapshot", snapshot.SnapshotId, "is week or more old");
		return true;
	}

	if (day != lastDay) {
		console.log("Snapshot", snapshot.SnapshotId, "is the last of the new day");
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
		return new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime();
	});

	items = items.slice(1);

	async.forEachSeries(items, function(snapshot, itemCb) {
		var date = new Date(snapshot.StartTime);
		var day = date.getDate();

		var onEnd = function() {
			lastDay = day;
			itemCb();
		};

		if(this._shouldDelete(snapshot, day, lastDay)) {
			this._ec2.deleteSnapshot({
				SnapshotId: snapshot.SnapshotId
			}, function(err) {
				onEnd();
			});
		} else {
			onEnd();
		}
	}.bind(this), callback);
};