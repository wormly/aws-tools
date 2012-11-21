
var async = require('async');

module.exports = DNSUpdater;

function DNSUpdater(route) {
	this._route = route;
}

DNSUpdater.prototype.run = function(options, callback) {
	if (options.recordName.substr(-1) != '.') options.recordName += '.';

	options.zone = options.recordName.replace(/\w+\./, '');

	this.getZoneId(options, callback);
};

DNSUpdater.prototype.getZoneId = function (options, callback) {
	this._route.ListHostedZones(function(err, data) {
		if (err) {
			return callback(err.Body.Response);
		}

		var hostedZones = data.Body.ListHostedZonesResponse.HostedZones.HostedZone;

		if (! (hostedZones instanceof Array)) hostedZones = [hostedZones];

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
	this._route.ListResourceRecordSets({ HostedZoneId: options.zoneId }, function(err, data) {
		if (err) {
			return callback(err.Body.Response);
		}

		var sets = data.Body.ListResourceRecordSetsResponse.ResourceRecordSets.ResourceRecordSet;

		if (! (sets instanceof Array)) sets = [sets];

		sets = sets.filter(function(recordSet) {
			return recordSet.Name === options.recordName;
		});

		options.recordSet = sets[0] || false;

		this.updateRecord(options, callback);
	}.bind(this));
};

DNSUpdater.prototype.updateRecord = function (options, callback) {
	var changes = [{
		Action          : 'CREATE',
		Name            : options.recordName,
		Type            : 'A',
		Ttl             : options.ttl || 60,
		ResourceRecords : [ options.ip ]
	}];

	var recordSet = options.recordSet;

	if (recordSet) {
		recordSet.Action = 'DELETE';
		recordSet.Ttl = recordSet.TTL;
		delete recordSet.TTL;
		// record set is slightly different than the format to delete
		recordSet.ResourceRecords.ResourceRecord = recordSet.ResourceRecords.ResourceRecord.Value;
		changes.unshift(recordSet);
	}

	this._route.ChangeResourceRecordSets({
		HostedZoneId   : options.zoneId,
		Changes        : changes
	}, function(err) {
		if (err) {
			callback(err.Body.Response);
		} else {
			callback(null, "updated DNS");
		}
	});
};