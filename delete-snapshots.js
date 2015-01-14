
var argv = require('optimist').argv;
var Retrier = require('./lib/retrier.js');
var SnapshotDeleter = require('./lib/snapshotdeleter.js');
var AWS = require('aws-sdk');

require('./update-config.js');

var ec2 = new AWS.EC2();
var retrier = new Retrier(argv.attempts || 5);
var deleter = new SnapshotDeleter(ec2);

retrier.run(function(callback) {
	deleter.deleteSnapshots(callback);
}, function(err) {
	if (err) {
		console.error(err);
		process.exit(100);
	}
});
