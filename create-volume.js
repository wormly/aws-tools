
var argv = require('optimist').argv;
var Retrier = require('./lib/retrier.js');
var VolumeCreator = require('./lib/volumecreator.js');
var AWS = require('aws-sdk');

AWS.config.update({
	accessKeyId: process.env.AWS_KEY,
	secretAccessKey: process.env.AWS_SECRET,
	region: process.env.AWS_REGION
});

var ec2 = new AWS.EC2();

var creator = new VolumeCreator(ec2.client);
var retrier = new Retrier(argv.attempts || 5);

retrier.run(function(callback) {
	creator.createVolume({
		snapshotSize: argv.snapshotSize,
		snapshotId: argv.snapshotId,
		device: argv.device || '/dev/sdh',
		instance: process.env.AWS_INSTANCE,
		zone: process.env.AWS_AZ
	}, callback);
}, function(err, volumeId) {
	if (err) {
		console.error(err);
		process.exit(100);
	} else {
		console.log(volumeId);
	}
});
