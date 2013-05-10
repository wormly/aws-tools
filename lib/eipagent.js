
module.exports = EIPAgent;

function EIPAgent(ec2) {
	this._ec2 = ec2;
}

EIPAgent.prototype.remapEIP = function(options, callback) {
	this._ec2.associateAddress({
		PublicIp: options.ip,
		InstanceId: options.instance
	}, function(err) {
		if (err) {
			callback(err);
		} else {
			callback(null);
		}
	});
};