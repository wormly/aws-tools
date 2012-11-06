
require('./utils.js');

describe('Snapshot finder', function() {
	var SnapshotFinder = require('../lib/snapshotfinder.js');

	var finder, ec2, foundCb;

	beforeEach(function() {
		ec2 = stub('DescribeSnapshots');
		foundCb = jasmine.createSpy();
		finder = new SnapshotFinder(ec2);
	});

	it('finds snapshots', function() {
		finder.findSnapshot({
			regexp: new RegExp('ccz', 'i')
		}, foundCb);

		expect(ec2.DescribeSnapshots.mostRecentCall.args[0]).toEqual({ Filter : [ { Name : 'status', Value : [ 'completed' ] } ] });

		ec2.DescribeSnapshots.mostRecentCall.args[1](null, {
			Body: {
				DescribeSnapshotsResponse: {
					snapshotSet: {
						item: [
							{
								description: 'not matches',
								startTime: new Date(10000)
							},
							{
								description: 'ccz',
								startTime: new Date(1000)
							},
							{
								description: 'CCZ',
								startTime: new Date(5000)
							}
						]
					}
				}
			}
		});

		expect(foundCb.mostRecentCall.args[1].description).toEqual('CCZ');
	});
});