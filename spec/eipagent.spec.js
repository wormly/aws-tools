
require('./utils.js');

describe('EIP Agent', function() {
	var EIPAgent = require('../lib/eipagent.js');

	var agent, ec2, ip = '1.2.3.4', data, instance = 'i-41234213';

	beforeEach(function() {
		ec2 = stub('associateAddress');
		data = stub('getInstanceId');
		agent = new EIPAgent(ec2, data);
	});

	it('remaps', function() {
		var cb = jasmine.createSpy();

		agent.remapEIP({
			ip: ip,
			instance: instance
		}, cb);

		expect(ec2.associateAddress.mostRecentCall.args[0]).toEqual({
			PublicIp : ip,
			InstanceId : instance
		});

		ec2.associateAddress.mostRecentCall.args[1](null, 'data');

		expect(cb).toHaveBeenCalledWith(null);
	});
});