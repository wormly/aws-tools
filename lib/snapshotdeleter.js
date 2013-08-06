
module.exports = SnapshotDeleter;

var async = require('async');
var DAY_SIZE = 86400;
var WEEK_SIZE = 604800;

function SnapshotDeleter(ec2) {
	this._ec2 = ec2;
}

SnapshotDeleter.prototype.deleteSnapshots = function(callback) {
	this._ec2.describeSnapshots({ OwnerIds : ['self'] }, function(err, data) {
		if (err) return callback(err);

		var snapshots = data.Snapshots;

		if (! snapshots) { // no snapshots...
			callback();
		} else {
			var groups = this._groupSnapshots(snapshots);

			async.forEachSeries(groups, this._deleteSnapshots.bind(this), callback);
		}
	}.bind(this));
};

SnapshotDeleter.prototype._groupSnapshots = function(snapshots) {
	var groups = {};

	snapshots.forEach(function(snapshot) {
		var description = snapshot.Description;

		if (description.indexOf('AUTO_DEL') === -1) return;

		var group = description.split('AUTO_DEL')[0].trim();

		if (! (group in groups)) groups[group] = [];

		groups[group].push(snapshot);
	});

	var result = [];

	for (var group in groups) {
		result.push(groups[group]);
	}

	return result;
};

SnapshotDeleter.prototype._shouldDelete = function(snapshot, day, lastDay) {
	var snapshotTime = snapshot.StartTime.getTime();
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
		return b.StartTime.getTime() - a.StartTime.getTime();
	});

	items = items.slice(1); // making sure the most recent snapshot is not deleted

	async.forEachSeries(items, function(snapshot, itemCb) {
		var date = snapshot.StartTime;
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