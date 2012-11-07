
module.exports = SnapshotFinder;

function SnapshotFinder(ec2) {
	this._ec2 = ec2;
}

SnapshotFinder.prototype.findSnapshot = function(options, callback) {
	this._ec2.DescribeSnapshots({
		Filter : [{
			Name : 'status',
			Value : [ 'completed' ]
		}]
	}, function (err, result) {
		if (err) {
			callback(err.Body.Response);
		} else {
			var items = result.Body.DescribeSnapshotsResponse.snapshotSet.item;

			items = items.filter(function (item) {
				return options.regexp.test(item.description);
			});

			items = items.sort(function (a, b) {
				return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
			});

			callback(null, items[0]);
		}
	});
};