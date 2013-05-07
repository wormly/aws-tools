
require('./utils.js');

describe('Snapshot finder', function() {
	var SnapshotFinder = require('../lib/snapshotfinder.js');

	var finder, ec2, foundCb;

	beforeEach(function() {
		ec2 = stub('describeSnapshots');
		foundCb = jasmine.createSpy();
		finder = new SnapshotFinder(ec2);
	});

	it('finds snapshots', function() {
		finder.findSnapshot({
			regexp: new RegExp('ccz', 'i')
		}, foundCb);

		expect(ec2.describeSnapshots.mostRecentCall.args[0]).toEqual({
			Filters : [{
				Name : 'status', Values : [ 'completed' ]
			}],
			OwnerIds : ['self']
		});

		ec2.describeSnapshots.mostRecentCall.args[1](null, {
			Snapshots: [
				{
					Description: 'not matches',
					StartTime: new Date(10000)
				},
				{
					Description: 'ccz',
					StartTime: new Date(1000)
				},
				{
					Description: 'CCZ',
					StartTime: new Date(5000)
				}
			]
		});

		expect(foundCb.mostRecentCall.args[1].Description).toEqual('CCZ');
	});
});