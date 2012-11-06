
var argv = require('optimist').argv;
var async = require('async');
var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var Ec2 = awssum.load('amazon/route53').Ec2;

var snapshot = argv.snapshot;
var size = argv.size;
var attempts = argv.attempts || 5;
var az = argv.az || process.env.AWS_AZ;
var instance = argv.instance || process.env.AWS_INSTANCE;

var ec2 = new Ec2({
	accessKeyId : argv.key || process.env.AWS_KEY,
	secretAccessKey : argv.secret || process.env.AWS_SECRET,
	region : argv.region || az.replace(/\D+$/, '')
});

var request = function (attempt) {
	if (attempt > attempts) {
		process.exit(1);
	}

	async.waterfall([function createVolume(callback) {
		ec2.CreateVolume({
				Size: size,
				SnapshotId: snapshot,
				AvailabilityZone: az
			}, function (err, data) {
				if (err) {
					return callback(err.Body.ErrorResponse);
				}

				console.log(data.Body);

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
