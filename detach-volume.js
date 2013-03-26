
var argv = require('optimist').argv;
var Ec2 = require('awssum-amazon-ec2').Ec2;

var Retrier = require('./lib/retrier.js');
var Detacher = require('./lib/detacher.js');
var InstanceData = require('./lib/instancedata.js');

var instanceDataGetter = new InstanceData(require('request'));

instanceDataGetter.getRegion(function(err, region) {
	var ec2 = new Ec2({
		accessKeyId : argv.key || process.env.AWS_KEY,
		secretAccessKey : argv.secret || process.env.AWS_SECRET,
		region: region
	});

	var detacher = new Detacher(ec2, instanceDataGetter);
	var retrier = new Retrier(argv.attempts || 5);

	retrier.run(function(callback) {
		detacher.detach({
			device: argv.device
		}, callback);
	}, function(err) {
		if (err) {
			console.error(err);
			process.exit(100);
		}
	});
});