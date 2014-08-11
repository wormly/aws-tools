
var async = require('async');

module.exports = DNSUpdater;

function DNSUpdater(route) {
	this._route = route;
}

DNSUpdater.prototype.run = function(options, callback) {
	if (options.recordName.substr(-1) != '.') options.recordName += '.';

	options.zone = options.recordName.split('.').slice(1).join('.');

	this.getZoneId(options, callback);
};

DNSUpdater.prototype.getZoneId = function (options, callback) {
	this._route.listHostedZones(function(err, data) {
		if (err) {
			return callback(err);
		}

		var hostedZones = data.HostedZones;

		var zone = hostedZones.filter(function(hostedZone) {
			return hostedZone.Name == options.zone;
		});

		if (zone.length == 0) {
			callback("No zone with name: "+hostedZones.Name)
		} else {
			options.zoneId = zone[0].Id.split('/')[2];

			this.findExistingRecord(options, callback);
		}
	}.bind(this));
};

DNSUpdater.prototype.findExistingRecord = function (options, callback) {
	this._route.listResourceRecordSets({ HostedZoneId: options.zoneId }, function(err, data) {
		if (err) {
			return callback(err);
		}

		var sets = data.ResourceRecordSets;

		sets = sets.filter(function(recordSet) {
			if (options.type && recordSet.Type != options.type) {
				return false;
			}
			
			return recordSet.Name === options.recordName;
		});

		options.recordSet = sets[0] || false;

		this.updateRecord(options, callback);
	}.bind(this));
};

DNSUpdater.prototype.updateRecord = function (options, callback) {
	var records = [];

	var type = 'A';

	options.ip.split(',').forEach(function(ip) {
		if (! ip) return;

		if (! /^(\d{1,3}\.?){4}$/.test(ip)) type = 'CNAME';

		records.push({
			Value: ip
		});
	});
	
	if (options.type) type = options.type;
	
	var changes = [{
		Action          : 'CREATE',
		ResourceRecordSet: {
			Name            : options.recordName,
			Type            : type,
			TTL             : options.ttl || 60,
			ResourceRecords : records
		}
	}];

	var recordSet = options.recordSet;

	if (recordSet) {
		changes.unshift({
			Action          : 'DELETE',
			ResourceRecordSet: recordSet
		});
	}

	this._route.changeResourceRecordSets({
		HostedZoneId   : options.zoneId,
		ChangeBatch    : {
			Changes: changes
		}
	}, function(err) {
		if (err) {
			callback(err);
		} else {
			callback(null, "updated DNS");
		}
	});
};