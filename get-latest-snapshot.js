
var argv = require('optimist').argv;

var Retrier = require('./lib/retrier.js');
var SnapshotFinder = require('./lib/snapshotfinder.js');
var AWS = require('aws-sdk');

require('./update-config.js');

var ec2 = new AWS.EC2();
var retrier = new Retrier(argv.attempts || 5);

retrier.run(function(callback) {
	var finder = new SnapshotFinder(ec2);
	
	finder.findSnapshot({
		regexp: new RegExp(argv.regexp, 'i')
	}, callback);
}, function(err, snapshot) {
	if (err) {
		console.error(err);
		process.exit(100);
	} else if (! snapshot) {
		// nothing found
	} else {
		console.log(snapshot.SnapshotId, snapshot.VolumeSize);
	}
});