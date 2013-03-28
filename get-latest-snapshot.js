
var argv = require('optimist').argv;

var Retrier = require('./lib/retrier.js');
var SnapshotFinder = require('./lib/snapshotfinder.js');
var AWS = require('aws-sdk');

AWS.config.update({
	accessKeyId: process.env.AWS_KEY,
	secretAccessKey: process.env.AWS_SECRET,
	region: process.env.AWS_REGION
});

var ec2 = new AWS.EC2();
var retrier = new Retrier(argv.attempts || 5);

retrier.run(function(callback) {
	var finder = new SnapshotFinder(ec2.client);

	finder.findSnapshot({
		regexp: new RegExp(argv.regexp, 'i')
	}, callback);
}, function(err, snapshot) {
	if (err) {
		console.error(err);
		process.exit(100);
	} else {
		console.log(snapshot.SnapshotId, snapshot.VolumeSize);
	}
});