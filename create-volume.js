
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

var retrier = new Retrier(argv.attempts || 5);

retrier.wrap(ec2, ['modifyInstanceAttribute', 'describeInstanceAttribute', 'attachVolume', 'createVolume']);

var creator = new VolumeCreator(ec2);

var options = {};
['snapshotSize', 'snapshotId', 'device'].forEach(function(key) {
	options[key] = argv[key];
});

options.instance = process.env.AWS_INSTANCE;
options.zone = process.env.AWS_AZ;
options.volumeType = argv.volumeType || 'standard';

if (['gp2', 'io1', 'standard'].indexOf(options.volumeType) == -1) {
	throw "Unsupported volume type "+options.volumeType;
}

retrier.run(function(callback) {
	creator.createVolume(options, callback);
}, function(err, volumeId) {
	if (err) {
		console.error(err);
		process.exit(100);
	} else {
		console.log(volumeId);
	}
});
