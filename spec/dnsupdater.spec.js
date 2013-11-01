
require('./utils.js');

describe('DNS Updater', function() {
	var DNSUpdater = require('../lib/dnsupdater.js');

	var updater, route, ip = '1.2.3.4,2.2.2.2', record = 'chef.dev.worm.ly', ttl = 60;

	var updatedCb;

	beforeEach(function() {
		route = stub('listHostedZones', 'listResourceRecordSets', 'changeResourceRecordSets');
		updatedCb = jasmine.createSpy();
		updater = new DNSUpdater(route);
	});

	it('updates', function() {
		updater.run({
			recordName: record,
			ttl: ttl,
			ip: ip
		}, updatedCb);

		route.listHostedZones.mostRecentCall.args[0](null, {
			HostedZones: [{
				Name: 'dev.worm.ly.',
				Id: '/zonezone/idid'
			}]
		});

		expect(route.listResourceRecordSets.mostRecentCall.args[0]).toEqual({ HostedZoneId : 'idid' });

		route.listResourceRecordSets.mostRecentCall.args[1](null, {
			ResourceRecordSets: [{
				Name: record+'.',
				Type : 'A',
				TTL: 123,
				ResourceRecords: [{
					Value: 'prev.ip'
				}]
			}]
		});

		expect(route.changeResourceRecordSets.mostRecentCall.args[0]).toEqual({
			HostedZoneId : 'idid',
			ChangeBatch: {
				Changes : [
					{
						Action : 'DELETE',
						ResourceRecordSet: {
							Name : 'chef.dev.worm.ly.',
							Type : 'A',
							TTL : 123,
							ResourceRecords : [{
								Value : 'prev.ip'
							}]
						}
					}, {
						Action : 'CREATE',
						ResourceRecordSet: {
							Name : 'chef.dev.worm.ly.',
							Type : 'A',
							TTL : 60,
							ResourceRecords : [{
								Value: '1.2.3.4'
							}, {
								Value: '2.2.2.2'
							}]
						}
					}
				]
			}
		});
	});
});