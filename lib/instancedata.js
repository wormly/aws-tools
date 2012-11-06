
module.exports = InstanceData;

function InstanceData(request) {
	this._request = request;
}

InstanceData.prototype.getAvailabilityZone = function(callback) {
	this._request("http://169.254.169.254/latest/meta-data/placement/availability-zone", function(err, response, body) {
		if (err) {
			callback(err);
		} else {
			callback(null, body);
		}
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