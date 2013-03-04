
require('./utils.js');

describe('Volume creator', function() {
	var VolumeCreator = require('../lib/volumecreator.js');

	var creator, ec2, data, snapId = '3123', snapSize = '1312', device = '/dev/vxcvxc', fs;

	var doneCallback;

	beforeEach(function() {
		ec2 = stub('CreateVolume', 'AttachVolume', 'ModifyInstanceAttribute');
		data = stub('getInstanceId', 'getAvailabilityZone');
		fs = stub('watch');
		creator = new VolumeCreator(ec2, data, fs);
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

		var watcher = stub('close');

		fs.watch.andCallFake(function() {
			return watcher;
		});

		ec2.AttachVolume.mostRecentCall.args[1](null, {
			Body: {
				AttachVolumeResponse: 'resp'
			}
		});

		expect(fs.watch.mostRecentCall.args[0]).toEqual('/dev');

		fs.watch.mostRecentCall.args[1]('change', 'otherhfgasdf;');
		expect(doneCallback).not.toHaveBeenCalled();
		fs.watch.mostRecentCall.args[1]('change', 'xvxc'); // 2 last letters preceded with d or xv

//		expect(ec2.ModifyInstanceAttribute.mostRecentCall.args[0]).toEqual({
//			InstanceId : 'instid',
//			BlockDeviceMapping : [
//				{ DeviceName : '/dev/vxcvxc', Ebs : [ { DeleteOnTermination : 'true', VolumeId : 'volid' } ] }
//			]
//		});
//
//		ec2.ModifyInstanceAttribute.mostRecentCall.args[1](null);

		expect(doneCallback).toHaveBeenCalledWith(null, 'volid');
	});
});