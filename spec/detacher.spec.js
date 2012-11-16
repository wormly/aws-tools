
require('./utils.js');

describe('Detacher', function() {
	var Detacher = require('../lib/detacher.js');

	var detacher, ec2, device = '/dev/ice', data;

	beforeEach(function() {
		ec2 = stub('DescribeVolumes', 'DetachVolume');
		data = stub('getInstanceId');
		detacher = new Detacher(ec2, data);
	});

	it('detaches', function() {
		var responseCallback = jasmine.createSpy();

		detacher.detach({
			device: device
		}, responseCallback);

		data.getInstanceId.mostRecentCall.args[0](null, 'instance');

		expect(ec2.DescribeVolumes.mostRecentCall.args[0]).toEqual({
			InstanceId : 'instance', Filter : [
				{ Name : 'attachment.instance-id', Value : [ 'instance' ] },
				{ Name : 'attachment.device', Value : '/dev/ice' }
			] });

		ec2.DescribeVolumes.mostRecentCall.args[1](null, {
			Body: {
				DescribeVolumesResponse: {
					volumeSet: {
						item: {
							id: 'itemid'
						}
					}
				}
			}
		});

		expect(ec2.DetachVolume.mostRecentCall.args[0]).toEqual({ VolumeId : 'itemid' });

		ec2.DetachVolume.mostRecentCall.args[1](null, {});

		expect(responseCallback).toHaveBeenCalledWith(null, {  });
	});
});