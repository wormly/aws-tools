
module.exports = SnapshotFinder;

function SnapshotFinder(ec2) {
	this._ec2 = ec2;
}

SnapshotFinder.prototype.findSnapshot = function(options, callback) {
	this._ec2.describeSnapshots({
		Filters : [{
			Name : 'status',
			Values : [ 'completed' ]
		}],
		OwnerIds : ['self']
	}, function (err, result) {
		if (err) {
			callback(err);
		} else {
			var snapshots = result.Snapshots;

			snapshots = snapshots.filter(function (item) {
				return options.regexp.test(item.Description);
			});

			snapshots = snapshots.sort(function (a, b) {
				return b.StartTime.getTime() - a.StartTime.getTime();
			});

			callback(null, snapshots[0]);
		}
	});
};