
require('./utils.js');

var async = require('async');

describe('Snapshot deleter', function() {
	var SnapshotDeleter = require('../lib/snapshotdeleter.js');

	var deleter, ec2, doneCallback, dataGetter;

	beforeEach(function() {
		ec2 = stub('describeSnapshots', 'deleteSnapshot');
		dataGetter = stub('getInstanceId');
		doneCallback = jasmine.createSpy();
		deleter = new SnapshotDeleter(ec2, dataGetter);
	});

	it('deletes snapshots', function() {
		deleter.deleteSnapshots(doneCallback);

		expect(ec2.describeSnapshots.mostRecentCall.args[0]).
			toEqual({ OwnerIds : ['self'] });

		ec2.describeSnapshots.mostRecentCall.args[1](null, {
			Snapshots: [
				{ StartTime: new Date('2012-11-10T11:37:17.000Z'), SnapshotId: 'last-one', Description: 'AAA AUTO_DEL 123' },
				{ StartTime: new Date(Date.now()), SnapshotId: 'most-recent', Description: 'AAA AUTO_DEL 123' },
				{ StartTime: new Date(Date.now() - 100 * 1000), SnapshotId: 'recent-2', Description: 'AAA AUTO_DEL 5264' },
				{ StartTime: new Date(Date.now() - 48 * 3600 * 1000), SnapshotId: 'this-week-last-of-day', Description: 'AAA AUTO_DEL 5264' },
				{ StartTime: new Date(Date.now() - 48 * 3600 * 1000 - 1000), SnapshotId: 'this-week-not-last', Description: 'AAA AUTO_DEL 5264' },
				{ StartTime: new Date(Date.now() - 200 * 1000), SnapshotId: 'recent-3', Description: 'AAA AUTO_DEL 654' },

				// These should never be deleted because they are the only remaining snapshots
				{ StartTime: new Date('2013-05-10T11:37:17.000Z'), SnapshotId: 'app-o', Description: 'app /data_o AUTO_DEL 2013-09-11 18:05:06' },
				{ StartTime: new Date('2013-05-10T11:37:17.000Z'), SnapshotId: 'app-p', Description: 'app /data_p AUTO_DEL 2013-09-11 18:05:06' },
				{ StartTime: new Date('2013-05-10T11:37:17.000Z'), SnapshotId: 'app-q', Description: 'app /data_q AUTO_DEL 2013-09-11 18:05:06' },
				{ StartTime: new Date('2013-05-10T11:37:17.000Z'), SnapshotId: 'app-r', Description: 'app /data_r AUTO_DEL 2013-09-11 18:05:06' },

				// This is one deleted, because a newer one exists
				{ StartTime: new Date('2013-03-10T11:37:17.000Z'), SnapshotId: 'app-vol-old', Description: 'app Volume AUTO_DEL 2013-03-08 19:29:22' },
				// This one is kept
				{ StartTime: new Date('2013-04-10T11:37:17.000Z'), SnapshotId: 'app-vol-new', Description: 'app Volume AUTO_DEL 2013-04-08 19:29:22' },

				{ StartTime: new Date('2012-11-10T11:37:17.000Z'), SnapshotId: 'last-one-other-prefix', Description: 'BBB AUTO_DEL 123' },
				{ StartTime: new Date('2012-12-10T11:37:17.000Z'), SnapshotId: 'old-one-other-prefix', Description: 'BBB AUTO_DEL 123' },
				{ StartTime: new Date(Date.now() - 1000000), SnapshotId: 'other-prefix', Description: 'BBB AUTO_DEL 523534' },
				{ StartTime: new Date(Date.now()), SnapshotId: 'most-recent-other-prefix', Description: 'BBB AUTO_DEL 5234' },

				{ StartTime: new Date('2012-11-10T11:38:17.000Z'), SnapshotId: 'not-applicable', Description: 'No applicable' }
			]
		});

		var deleted = ['this-week-not-last', 'last-one', 'app-vol-old', 'old-one-other-prefix', 'last-one-other-prefix'];

		async.forEachSeries(deleted, function(name, cb) {
			expect(ec2.deleteSnapshot.mostRecentCall.args[0]).toEqual({ SnapshotId : name });
			ec2.deleteSnapshot.mostRecentCall.args[1]();
			cb();
		}, function() {
			expect(ec2.deleteSnapshot.callCount).toEqual(deleted.length);
			expect(doneCallback).toHaveBeenCalled();
		});
	});
});