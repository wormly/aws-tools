
module.exports = Detacher;

function Detacher(ec2, dataGetter) {
	this._ec2 = ec2;
	this._dataGetter = dataGetter;
}

Detacher.prototype.detach = function(options, callback) {
	this._dataGetter.getInstanceId(function(err, instanceId) {
		if (err) return callback(err);

		this._ec2.DescribeVolumes({
			InstanceId: instanceId,
			Filter : [
				{
					Name : 'attachment.instance-id',
					Value : [ instanceId ]
				}, {
					Name : 'attachment.device',
					Value : options.device
				}
			]
		}, function(err, data) {
			if (err) return callback(err);

			var item = data.Body.DescribeVolumesResponse.volumeSet.item;

			if (! item) {
				callback();
			} else {
				this.detachVolume({
					volumeId: item.id
				}, callback);
			}
		}.bind(this));
	}.bind(this));
};

Detacher.prototype.detachVolume = function(options, callback) {
	console.log("Detaching", options.volumeId);

	this._ec2.DetachVolume({
		VolumeId: options.volumeId
	}, function(err, data) {
		if (err) {
			callback(err);
		} else {
			callback(err, data);
		}
	});
};