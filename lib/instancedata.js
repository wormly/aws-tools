
module.exports = InstanceData;

function InstanceData(request) {
	this._request = request;
}

InstanceData.prototype.getInstanceId = function(callback) {
	this._request("http://169.254.169.254/latest/meta-data/instance-id", function(err, response, body) {
		callback(err, body);
	});
};

InstanceData.prototype.getAvailabilityZone = function(callback) {
	this._request("http://169.254.169.254/latest/meta-data/placement/availability-zone", function(err, response, body) {
		callback(err, body);
	});
};

InstanceData.prototype.getRegion = function(callback) {
	this.getAvailabilityZone(function(err, zone) {
		if (err) {
			callback(err);
		} else {
			callback(null, zone.replace(/\D+$/, ''));
		}
	});
};