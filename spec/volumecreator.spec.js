
require('./utils.js');

describe('Volume creator', function() {
	var VolumeCreator = require('../lib/volumecreator.js');

	var creator, ec2, data, snapId = '3123', snapSize = '1312', device = '/dev/vxcvxc';

	var doneCallback;

	beforeEach(function() {
		ec2 = stub('CreateVolume', 'AttachVolume');
		data = stub('getInstanceId', 'getAvailabilityZone');
		creator = new VolumeCreator(ec2, data);
		doneCallback = jasmine.createSpy();
	});

	it('creates and attaches a volume', function() {
		creator.createVolume({
			snapshotSize: snapSize,
			snapshotId: snapId,
			device: device
		}, doneCallback);

		data.getAvailabilityZone.mostRecentCall.args[0](null, 'azaz');

		expect(ec2.CreateVolume.mostRecentCall.args[0]).toEqual({ Size : '1312', SnapshotId : '3123', AvailabilityZone : 'azaz' });

		ec2.CreateVolume.mostRecentCall.args[1](null, {
			Body: {
				CreateVolumeResponse: {
					volumeId: 'volid'
				}
			}
		});

		data.getInstanceId.mostRecentCall.args[0](null, 'instid');

		expect(ec2.AttachVolume.mostRecentCall.args[0]).toEqual({ InstanceId : 'instid', VolumeId : 'volid', Device : '/dev/vxcvxc' });

		ec2.AttachVolume.mostRecentCall.args[1](null, {
			Body: {
				AttachVolumeResponse: 'resp'
			}
		});

		expect(doneCallback).toHaveBeenCalledWith(null, 'resp');
	});
});