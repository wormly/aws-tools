
require('./utils.js');

describe('DNS Updater', function() {
	var DNSUpdater = require('../lib/dnsupdater.js');

	var updater, route, ip = '1.2.3.4', record = 'chef.dev.worm.ly', ttl = 60;

	var updatedCb;

	beforeEach(function() {
		route = stub('ListHostedZones', 'ListResourceRecordSets', 'ChangeResourceRecordSets');
		updatedCb = jasmine.createSpy();
		updater = new DNSUpdater(route);
	});

	it('updates', function() {
		updater.run({
			recordName: record,
			ttl: ttl,
			ip: ip
		}, updatedCb);

		waitsFor(function() {
			return route.ListHostedZones.callCount > 0;
		});

		runs(function() {
			route.ListHostedZones.mostRecentCall.args[0](null, {
				Body: {
					ListHostedZonesResponse: {
						HostedZones: {
							HostedZone: {
								Name: 'dev.worm.ly.',
								Id: '/zonezone/idid'
							}
						}
					}
				}
			});
		});

		waitsFor(function() {
			return route.ListResourceRecordSets.callCount > 0;
		});

		runs(function() {
			expect(route.ListResourceRecordSets.mostRecentCall.args[0]).toEqual({ HostedZoneId : 'idid' });

			route.ListResourceRecordSets.mostRecentCall.args[1](null, {
				Body: {
					ListResourceRecordSetsResponse: {
						ResourceRecordSets: {
							ResourceRecordSet: {
								TTL: 123,
								Name: record+'.',
								ResourceRecords: {
									ResourceRecord: {
										Value: 'prev.ip'
									}
								}
							}
						}
					}
				}
			})
		});

		waitsFor(function() {
			return route.ChangeResourceRecordSets.callCount > 0;
		});

		runs(function() {
			expect(route.ChangeResourceRecordSets.mostRecentCall.args[0]).toEqual({
				HostedZoneId : 'idid',
				Changes : [
					{
						Name : 'chef.dev.worm.ly.',
						ResourceRecords : { ResourceRecord : 'prev.ip' },
						Action : 'DELETE',
						Ttl : 123
					},
					{
						Action : 'CREATE',
						Name : 'chef.dev.worm.ly.',
						Type : 'A',
						Ttl : 60,
						ResourceRecords : [ '1.2.3.4' ]
					}
				]
			});
		})
	});
});