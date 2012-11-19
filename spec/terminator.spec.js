
require('./utils.js');

describe('Terminator', function() {
	var Terminator = require('../lib/terminator.js');

	var terminator, ec2, data;

	beforeEach(function() {
		ec2 = stub('TerminateInstances');
		data = stub('getInstanceId');
		terminator = new Terminator(ec2, data);
	});

	it('terminates', function() {
		var cb = jasmine.createSpy();

		terminator.terminateItself({}, cb);

		expect(data.getInstanceId).toHaveBeenCalled();
		data.getInstanceId.mostRecentCall.args[0](null, 'instance');

		expect(ec2.TerminateInstances.mostRecentCall.args[0]).toEqual({ InstanceId : [ 'instance' ] });

		ec2.TerminateInstances.mostRecentCall.args[1](null, 'data');

		expect(cb).toHaveBeenCalled();
	});
});