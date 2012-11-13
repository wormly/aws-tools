
module.exports = SnapshotCreator;

function SnapshotCreator(ec2, dataGetter) {
	this._ec2 = ec2;
	this._dataGetter = dataGetter;
}

SnapshotCreator.prototype.createSnapshot = function(options, callback) {
	this._dataGetter.getInstanceId(function(err, instanceId) {
		if (err) return callback(err);

		this._ec2.DescribeInstances({
			InstanceId: instanceId
		}, function(err, data) {
			console.log(err, data.Body.DescribeInstancesResponse);
		})
	}.bind(this));
};