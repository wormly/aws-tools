
module.exports = Terminator;

function Terminator(ec2, dataGetter) {
	this._ec2 = ec2;
	this._dataGetter = dataGetter;
}

Terminator.prototype.terminateItself = function(options, callback) {
	this._dataGetter.getInstanceId(function(err, id) {
		if (err) return callback(err);

		this._ec2.TerminateInstances({
			InstanceId: [ id ]
		}, function (err) {
			if (err) {
				callback(err.Body.Response);
			} else {
				callback(null);
			}
		})
	}.bind(this));
};

