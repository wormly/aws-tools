
var argv = require('optimist').argv;

var attempts = argv.attempts || 5;

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

	route.ChangeResourceRecordSets({
		HostedZoneId   : argv.zone || 'dev.worm.ly',
		Comment        : 'Automated change at '+new Date().toString(),
		Changes        : [
			{
				Action          : 'CREATE',
				Name            : argv.name || 'chef.dev.worm.ly',
				Type            : 'A',
				Ttl             : argv.ttl || 60,
				ResourceRecords : [argv.ip]
			},
		]
	}, function (err, result) {
		if (err) {
			console.log(err.Body.ErrorResponse);
			console.log("Waiting", attempt * 5, "sec");
			setTimeout(request.bind(null, attempt + 1), attempt * 5000);
			return;
		}

		console.log(result.Body);
	});
};

request(1);
