
require('./utils.js');

describe('Snapshot deleter', function() {
	var SnapshotDeleter = require('../lib/snapshotdeleter.js');

	var deleter, ec2, doneCallback, dataGetter;

	beforeEach(function() {
		ec2 = stub('DescribeVolumes', 'DescribeSnapshots', 'DeleteSnapshot');
		dataGetter = stub('getInstanceId');
		doneCallback = jasmine.createSpy();
		deleter = new SnapshotDeleter(ec2, dataGetter);

		clock.now = Date('2012-11-21T11:37:17.000Z').getTime();
	});

	it('deletes snapshots by description', function() {
		deleter.deleteSnapshotsByDescription({
			regexp: new RegExp('^Snappy', 'i')
		}, doneCallback);

		expect(ec2.DescribeSnapshots.mostRecentCall.args[0]).
			toEqual({ });

		ec2.DescribeSnapshots.mostRecentCall.args[1](null, {
			Body: { DescribeSnapshotsResponse: { snapshotSet: { item: [
				{ startTime: '2012-11-10T11:37:17.000Z', snapshotId: 'not matches', description: 'Not snappy' },
				{ startTime: '2012-11-10T11:38:17.000Z', snapshotId: 'matches-but-last', description: 'snappy' },
				{ startTime: '2012-11-10T11:37:17.000Z', snapshotId: 'matches', description: 'snappy' }
			]}}}
		});

		expect(ec2.DeleteSnapshot.mostRecentCall.args[0]).toEqual({ SnapshotId : 'matches' });
		ec2.DeleteSnapshot.mostRecentCall.args[1]();

		expect(ec2.DeleteSnapshot.callCount).toEqual(1);
		expect(doneCallback).toHaveBeenCalled();
	});

	it('deletes snapshots by device', function() {
		deleter.deleteSnapshotsByDevice({
			device: '/dev/ice'
		}, doneCallback);

		dataGetter.getInstanceId.mostRecentCall.args[0](null, 'instance');

		expect(ec2.DescribeVolumes.mostRecentCall.args[0]).toEqual({
			InstanceId : 'instance', Filter : [
				{ Name : 'attachment.instance-id', Value : [ 'instance' ] },
				{ Name : 'attachment.device', Value : '/dev/ice' }
			] });

		ec2.DescribeVolumes.mostRecentCall.args[1](null, {
			Body: { DescribeVolumesResponse: { volumeSet: { item: { volumeId: 'itemid' } } } }
		});

		// got volume id
		expect(ec2.DescribeSnapshots.mostRecentCall.args[0]).
			toEqual({ Filter : [ { Name : 'volume-id', Value : [ 'itemid' ] } ] });

		ec2.DescribeSnapshots.mostRecentCall.args[1](null, {
			Body: { DescribeSnapshotsResponse: { snapshotSet: { item: [
				{ startTime: '2012-11-21T11:07:17.000Z', snapshotId: 'too-young' },
				{ startTime: '2012-11-19T19:50:17.000Z', snapshotId: 'the-last-of-the-day' },
				{ startTime: '2012-11-19T18:50:17.000Z', snapshotId: 'not-the-last' },
				{ startTime: '2012-11-19T17:50:17.000Z', snapshotId: 'not-the-last-2' },
				{ startTime: '2012-11-18T19:50:17.000Z', snapshotId: 'the-last-of-the-day' },
				{ startTime: '2012-11-18T17:50:17.000Z', snapshotId: 'not-the-last-3' },
				{ startTime: '2012-11-10T11:37:17.000Z', snapshotId: 'too-old' }
			]}}}
		});

		expect(ec2.DeleteSnapshot.mostRecentCall.args[0]).toEqual({ SnapshotId : 'not-the-last' });
		ec2.DeleteSnapshot.mostRecentCall.args[1]();

		expect(ec2.DeleteSnapshot.mostRecentCall.args[0]).toEqual({ SnapshotId : 'not-the-last-2' });
		ec2.DeleteSnapshot.mostRecentCall.args[1]();

		expect(ec2.DeleteSnapshot.mostRecentCall.args[0]).toEqual({ SnapshotId : 'not-the-last-3' });
		ec2.DeleteSnapshot.mostRecentCall.args[1]();

		expect(ec2.DeleteSnapshot.mostRecentCall.args[0]).toEqual({ SnapshotId : 'too-old' });
		ec2.DeleteSnapshot.mostRecentCall.args[1]();

		expect(doneCallback).toHaveBeenCalled();
	});
});