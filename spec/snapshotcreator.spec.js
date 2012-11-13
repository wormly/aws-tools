
require('./utils.js');

describe('Volume creator', function() {
	var SnapshotCreator = require('../lib/snapshotcreator.js');

	var creator, ec2, data, device = '/dev/xvdh', description = 'cool snapshot';

	var doneCallback;

	beforeEach(function() {
		ec2 = stub('CreateSnapshot', 'DescribeInstances');
		data = stub('getInstanceId', 'getAvailabilityZone');
		creator = new SnapshotCreator(ec2, data);
		doneCallback = jasmine.createSpy();
	});

	it('makes snapshot', function() {
		creator.createSnapshot({
			device: device,
			description: description
		},  doneCallback);

		expect().toHaveBeenCalled();
	});
});