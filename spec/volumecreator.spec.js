
require('./utils.js');

describe('Volume creator', function() {
	var VolumeCreator = require('../lib/volumecreator.js');

	var creator, ec2, snapId = '3123', snapSize = '1312', device = '/dev/vxcvxc', zone = 'az-1',
		instance = 'i-1234123', volume = 'fasdfasdf';

	var doneCallback;

	beforeEach(function() {
		ec2 = stub('createVolume', 'attachVolume', 'modifyInstanceAttribute', 'describeInstanceAttribute');
		creator = new VolumeCreator(ec2);
		doneCallback = jasmine.createSpy();
	});

	it('returns better error description', function() {
		creator.createVolume({
			snapshotSize: snapSize,
			snapshotId: snapId,
			device: device,
			zone: zone,
			instance: instance
		}, doneCallback);

		ec2.createVolume.mostRecentCall.args[1]({err: 1});

		expect(doneCallback).toHaveBeenCalledWith({
			err : 1,
			operation : 'createVolume',
			request : {
				Size : snapSize,
				SnapshotId : snapId,
				AvailabilityZone : zone
			}
		});
	});

	it('creates and attaches a volume', function() {
		creator.createVolume({
			snapshotSize: snapSize,
			snapshotId: snapId,
			device: device,
			zone: zone,
			instance: instance
		}, doneCallback);

		expect(ec2.createVolume.mostRecentCall.args[0]).toEqual({
			Size : '1312',
			SnapshotId : '3123',
			AvailabilityZone : zone
		});

		ec2.createVolume.mostRecentCall.args[1](null, {
			VolumeId: volume
		});

		expect(ec2.attachVolume.mostRecentCall.args[0]).toEqual({
			InstanceId : instance,
			VolumeId : volume,
			Device : device
		});

		ec2.attachVolume.mostRecentCall.args[1](null, {});

		expect(ec2.describeInstanceAttribute.mostRecentCall.args[0]).toEqual({
			InstanceId : instance,
			Attribute : 'blockDeviceMapping'
		});

		ec2.describeInstanceAttribute.mostRecentCall.args[1](null, {BlockDeviceMappings: [{
			DeviceName: 'other',
			Ebs: {
				Status: 'attached'
			}
		}, {
			DeviceName: device,
			Ebs: {
				Status: 'attaching'
			}
		}]}); // not attached yet

		tick(5000);
		expect(ec2.describeInstanceAttribute.callCount).toEqual(2);

		ec2.describeInstanceAttribute.mostRecentCall.args[1](null, {BlockDeviceMappings: [{
			DeviceName: device,
			Ebs: {
				Status: 'attached'
			}
		}]});

		expect(ec2.modifyInstanceAttribute.mostRecentCall.args[0]).toEqual({
			InstanceId : instance,
			BlockDeviceMappings : [{
				DeviceName : device,
				Ebs : {
					DeleteOnTermination : true,
					VolumeId : volume
				}
			}]
		});

		ec2.modifyInstanceAttribute.mostRecentCall.args[1](null);

		expect(doneCallback).toHaveBeenCalledWith(null, volume);
	});
});