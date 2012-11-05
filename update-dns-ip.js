
var argv = require('optimist').argv;

var attempts = argv.attempts || 5;

var name = argv.name || 'chef.dev.worm.ly.';
var zoneName = argv.zone || 'dev.worm.ly.';
var async = require('async');
var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var Route53 = awssum.load('amazon/route53').Route53;

var route = new Route53({
	accessKeyId : argv.key,
	secretAccessKey : argv.secret,
	region : argv.region || 'eu-west-1'
});

var request = function (attempt) {
	if (attempt > attempts) {
		process.exit(1);
	}

	async.waterfall([function getZoneId(callback) {
		route.ListHostedZones(function(err, data) {
			if (err) {
				return callback(err.Body.ErrorResponse);
			}

			var hostedZones = data.Body.ListHostedZonesResponse.HostedZones.HostedZone;

			if (! (hostedZones instanceof Array)) hostedZones = [hostedZones];

			var zone = hostedZones.filter(function(hostedZone) {
				return hostedZone.Name == zoneName;
			});

			if (zone.length == 0) {
				callback("No zone with name: "+hostedZones.Name)
			} else {
				callback(null, zone[0].Id.split('/')[2]);
			}
		});
	}, function findExistingRecord(zoneId, callback) {
		route.ListResourceRecordSets({ HostedZoneId: zoneId }, function(err, data) {
			if (err) {
				return callback(err.Body.ErrorResponse);
			}

			var sets = data.Body.ListResourceRecordSetsResponse.ResourceRecordSets.ResourceRecordSet;

			if (! (sets instanceof Array)) sets = [sets];

			sets = sets.filter(function(recordSet) {
				return recordSet.Name === name;
			});

			var recordSet = sets[0] || false;

			callback(null, zoneId, recordSet);
		});
	}, function updateRecord(zoneId, recordSet, callback) {
		var changes = [{
			Action          : 'CREATE',
			Name            : name,
			Type            : 'A',
			Ttl             : argv.ttl || 60,
			ResourceRecords : [ argv.ip ]
		}];

		if (recordSet) {
			recordSet.Action = 'DELETE';
			recordSet.Ttl = recordSet.TTL;
			// record set is slightly different than the format to delete
			recordSet.ResourceRecords.ResourceRecord = recordSet.ResourceRecords.ResourceRecord.Value;
			changes.unshift(recordSet);
		}

		route.ChangeResourceRecordSets({
			HostedZoneId   : zoneId,
			Comment        : 'Automated change at '+new Date().toString(),
			Changes        : changes
		}, function(err) {
			if (err) {
				callback(err.Body.ErrorResponse);
			} else {
				callback();
			}
		});
	}], function(err) {
		if (err) {
			console.log(err);
			console.log("Waiting", attempt * 5, "sec");
			setTimeout(request.bind(null, attempt + 1), attempt * 5000);
		} else {
			console.log("Updated successfully");
		}
	});
};

request(1);
