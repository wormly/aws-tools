
var argv = require('optimist').argv;
var Retrier = require('./lib/retrier.js');
var VolumeCreator = require('./lib/volumecreator.js');
var AWS = require('aws-sdk');
// AWS.config.logger = console;

require('./update-config.js');

var ec2 = new AWS.EC2();

var retrier = new Retrier(argv.attempts || 5);

retrier.wrap(ec2, ['modifyInstanceAttribute', 'describeInstanceAttribute', 'attachVolume', 'createVolume']);

var creator = new VolumeCreator(ec2);

var options = {};
[
	'snapshotSize',
	'snapshotId',
	'device',
	'iops',
].forEach(function(key) {
	options[key] = argv[key];
});

options.instance = process.env.AWS_INSTANCE;
options.zone = process.env.AWS_AZ;
options.volumeType = argv.volumeType || 'gp2';

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
