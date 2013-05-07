
require('./utils.js');

describe('Snapshot deleter', function() {
	var SnapshotDeleter = require('../lib/snapshotdeleter.js');

	var deleter, ec2, doneCallback, dataGetter;

	beforeEach(function() {
		ec2 = stub('describeSnapshots', 'deleteSnapshot');
		dataGetter = stub('getInstanceId');
		doneCallback = jasmine.createSpy();
		deleter = new SnapshotDeleter(ec2, dataGetter);
	});

	it('deletes snapshots by description', function() {
		deleter.deleteSnapshotsByDescription({
			regexp: new RegExp('^Snappy', 'i')
		}, doneCallback);

		expect(ec2.describeSnapshots.mostRecentCall.args[0]).
			toEqual({ });

		ec2.describeSnapshots.mostRecentCall.args[1](null, {
			Snapshots: [
				{ StartTime: new Date('2012-11-10T11:37:17.000Z'), SnapshotId: 'not matches', Description: 'Not snappy' },
				{ StartTime: new Date('2012-11-10T11:38:17.000Z'), SnapshotId: 'matches-but-last', Description: 'snappy' },
				{ StartTime: new Date('2012-11-10T11:37:17.000Z'), SnapshotId: 'matches', Description: 'snappy' }
			]
		});

		expect(ec2.deleteSnapshot.mostRecentCall.args[0]).toEqual({ SnapshotId : 'matches' });
		ec2.deleteSnapshot.mostRecentCall.args[1]();

		expect(ec2.deleteSnapshot.callCount).toEqual(1);
		expect(doneCallback).toHaveBeenCalled();
	});
});