
var argv = require('optimist').argv;

var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var Ec2 = awssum.load('amazon/ec2').Ec2;

var Retrier = require('./lib/retrier.js');
var SnapshotDeleter = require('./lib/snapshotdeleter.js');
var InstanceData = require('./lib/instancedata.js');

var instanceDataGetter = new InstanceData(require('request'));

instanceDataGetter.getRegion(function(err, region) {
	var ec2 = new Ec2({
		accessKeyId : argv.key || process.env.AWS_KEY,
		secretAccessKey : argv.secret || process.env.AWS_SECRET,
		region: argv.region || region
	});

	var retrier = new Retrier(argv.attempts || 5);
	var deleter = new SnapshotDeleter(ec2, instanceDataGetter);

	if (! argv.regexp) {
		console.log("Regexp is required");
		return;
	}

	retrier.run(function(callback) {
		deleter.deleteSnapshotsByDescription({
			regexp: new RegExp(argv.regexp, 'i')
		}, callback);
	}, function(err) {
		if (err) {
			console.error(err);
			process.exit(100);
		}
	});
});