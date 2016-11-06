
require('./utils.js');

describe('DNS Updater', function() {
	var DNSUpdater = require('../lib/dnsupdater.js');

	var updater, route, ip = '1.2.3.4,2.2.2.2,', record = 'chef.dev.worm.ly', ttl = 60, cname = 'a.d.wormly.dev';

	var updatedCb;

	beforeEach(function() {
		route = stub('listHostedZones', 'listResourceRecordSets', 'changeResourceRecordSets');
		updatedCb = jasmine.createSpy();
		updater = new DNSUpdater(route);
	});

	it('updates ip', function() {
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

	it('updates cname', function() {
		updater.run({
			recordName: record,
			ttl: ttl,
			ip: cname
		}, updatedCb);

		route.listHostedZones.mostRecentCall.args[0](null, {
			HostedZones: [{
				Name: 'dev.worm.ly.',
				Id: '/zonezone/idid'
			}]
		});

		expect(route.listResourceRecordSets.mostRecentCall.args[0]).toEqual({ HostedZoneId : 'idid' });

		route.listResourceRecordSets.mostRecentCall.args[1](null, { ResourceRecordSets: [] });

		expect(route.changeResourceRecordSets.mostRecentCall.args[0]).toEqual({
			HostedZoneId : 'idid',
			ChangeBatch: {
				Changes : [
					{
						Action : 'CREATE',
						ResourceRecordSet: {
							Name : 'chef.dev.worm.ly.',
							Type : 'CNAME',
							TTL : 60,
							ResourceRecords : [{
								Value: cname
							}]
						}
					}
				]
			}
		});
	});

	it('updates mx', function() {
		updater.run({
			recordName: record,
			ttl: ttl,
			ip: '10 a.b.c',
			type: 'MX'
		}, updatedCb);

		route.listHostedZones.mostRecentCall.args[0](null, {
			HostedZones: [{
				Name: 'dev.worm.ly.',
				Id: '/zonezone/idid'
			}]
		});
		
		expect(route.listResourceRecordSets.mostRecentCall.args[0]).toEqual({ HostedZoneId : 'idid' });
		
		route.listResourceRecordSets.mostRecentCall.args[1](null, { ResourceRecordSets: [{
			name: record
		}] });

		expect(route.changeResourceRecordSets.mostRecentCall.args[0]).toEqual({
			HostedZoneId : 'idid',
			ChangeBatch: {
				Changes : [
					{
						Action : 'CREATE',
						ResourceRecordSet: {
							Name : 'chef.dev.worm.ly.',
							Type : 'MX',
							TTL : 60,
							ResourceRecords : [{
								Value: '10 a.b.c'
							}]
						}
					}
				]
			}
		});
	});

	it('updates TXT on a subdomain', function() {
		updater.run({
			recordName: "_somechallenge.www.dev.worm.ly",
			zone: "dev.worm.ly.",
			ttl: ttl,
			ip: '"some text record"',
			type: 'TXT'
		}, updatedCb);

		route.listHostedZones.mostRecentCall.args[0](null, {
			HostedZones: [{
				Name: 'dev.worm.ly.',
				Id: '/zonezone/idid'
			}]
		});
		
		expect(route.listResourceRecordSets.mostRecentCall.args[0]).toEqual({ HostedZoneId : 'idid' });
		
		route.listResourceRecordSets.mostRecentCall.args[1](null, { ResourceRecordSets: [{
			name: "_somechallenge.www.dev.worm.ly"
		}] });

		expect(route.changeResourceRecordSets.mostRecentCall.args[0]).toEqual({
			HostedZoneId : 'idid',
			ChangeBatch: {
				Changes : [
					{
						Action : 'CREATE',
						ResourceRecordSet: {
							Name : '_somechallenge.www.dev.worm.ly.',
							Type : 'TXT',
							TTL : 60,
							ResourceRecords : [{
								Value: '"some text record"'
							}]
						}
					}
				]
			}
		});
	});
});