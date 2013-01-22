
module.exports = EIPAgent;

function EIPAgent(ec2, dataGetter) {
	this._ec2 = ec2;
	this._dataGetter = dataGetter;
}

EIPAgent.prototype.remapEIP = function(options, callback) {
	this._dataGetter.getInstanceId(function(err, id) {
		if (err) return callback(err);

		this._ec2.AssociateAddress({
			PublicIp: options.ip,
			InstanceId: id
		}, function(err) {
			if (err) {
				callback(err.Body.Response);
			} else {
				callback(null);
			}
		});
	}.bind(this));
};