
var argv = require('optimist').argv;
var Retrier = require('./lib/retrier.js');
var SnapshotDeleter = require('./lib/snapshotdeleter.js');
var AWS = require('aws-sdk');

AWS.config.update({
	accessKeyId: process.env.AWS_KEY,
	secretAccessKey: process.env.AWS_SECRET,
	region: argv.region
});

var ec2 = new AWS.EC2();
var retrier = new Retrier(argv.attempts || 5);
var deleter = new SnapshotDeleter(ec2.client);

if (! argv.regexp) {
	console.log("Regexp is required");
	return;
}

retrier.run(function(callback) {
	deleter.deleteSnapshots(callback);
}, function(err) {
	if (err) {
		console.error(err);
		process.exit(100);
	}
});
