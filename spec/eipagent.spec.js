
require('./utils.js');

describe('EIP Agent', function() {
	var EIPAgent = require('../lib/eipagent.js');

	var agent, ec2, ip = '1.2.3.4', data;

	beforeEach(function() {
		ec2 = stub('AssociateAddress');
		data = stub('getInstanceId');
		agent = new EIPAgent(ec2, data);
	});

	it('remaps', function() {
		var cb = jasmine.createSpy();

		agent.remapEIP({
			ip: ip
		}, cb);

		expect(data.getInstanceId).toHaveBeenCalled();
		data.getInstanceId.mostRecentCall.args[0](null, 'instance');

		expect(ec2.AssociateAddress.mostRecentCall.args[0]).toEqual({ PublicIp : ip, InstanceId : 'instance' });

		ec2.AssociateAddress.mostRecentCall.args[1](null, 'data');

		expect(cb).toHaveBeenCalledWith(null);
	});
});