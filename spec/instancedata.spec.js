
require('./utils.js');

describe('Instance data getter', function() {
	var InstanceData = require('../lib/instancedata.js');

	var dataGetter, request, cb;

	beforeEach(function() {
		request = jasmine.createSpy();
		cb = jasmine.createSpy();
		dataGetter = new InstanceData(request);
	});

	it('getz az', function() {
		dataGetter.getAvailabilityZone(cb);

		expect(request.mostRecentCall.args[0]).toEqual('http://169.254.169.254/latest/meta-data/placement/availability-zone');
		request.mostRecentCall.args[1](null, 1, 'eu-west-1b');

		expect(cb).toHaveBeenCalledWith(null, 'eu-west-1b');
	});

	it('getz az with error', function() {
		dataGetter.getAvailabilityZone(cb);

		request.mostRecentCall.args[1]('errrr');
		expect(cb).toHaveBeenCalledWith('errrr');
	});

	it('gets region', function() {
		dataGetter.getRegion(cb);

		request.mostRecentCall.args[1](null, 1, 'eu-west-1b');

		expect(cb).toHaveBeenCalledWith(null, 'eu-west-1');
	});
});