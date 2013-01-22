
var argv = require('optimist').argv;

var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var Ec2 = awssum.load('amazon/ec2').Ec2;

var Retrier = require('./lib/retrier.js');
var SnapshotFinder = require('./lib/snapshotfinder.js');
var InstanceData = require('./lib/instancedata.js');

var instanceDataGetter = new InstanceData(require('request'));

var retrier = new Retrier(argv.attempts || 5);

retrier.run(function(callback) {
	instanceDataGetter.getRegion(function(err, region) {
		if (err) {
			callback(err);
			return;
		}

		var ec2 = new Ec2({
			accessKeyId : argv.key || process.env.AWS_KEY,
			secretAccessKey : argv.secret || process.env.AWS_SECRET,
			region: region
		});

		var finder = new SnapshotFinder(ec2);

		finder.findSnapshot({
			regexp: new RegExp(argv.regexp, 'i')
		}, callback);
	});
}, function(err, snapshot) {
	if (err) {
		console.error(err);
	} else {
		console.log(snapshot.snapshotId, snapshot.volumeSize);
	}
});