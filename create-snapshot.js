
var argv = require('optimist').argv;
var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var Ec2 = awssum.load('amazon/ec2').Ec2;

var Retrier = require('./lib/retrier.js');
var SnapshotCreator = require('./lib/snapshotcreator.js');
var InstanceData = require('./lib/instancedata.js');

var instanceDataGetter = new InstanceData(require('request'));

instanceDataGetter.getRegion(function(err, region) {
	var ec2 = new Ec2({
		accessKeyId : argv.key || process.env.AWS_KEY,
		secretAccessKey : argv.secret || process.env.AWS_SECRET,
		region: region
	});

	var creator = new SnapshotCreator(ec2, instanceDataGetter);
	var retrier = new Retrier(argv.attempts || 5);

	retrier.run(function(callback) {
		creator.createSnapshot({
			device: argv.device,
			description: argv.description
		}, callback);
	}, function(err, data) {
		console.log("Finished:", data);
		if (err) console.log("Error:", err);
	});
});