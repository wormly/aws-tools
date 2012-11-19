
var argv = require('optimist').argv;

var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var Ec2 = awssum.load('amazon/ec2').Ec2;

var Retrier = require('./lib/retrier.js');
var Terminator = require('./lib/terminator.js');
var InstanceData = require('./lib/instancedata.js');

var instanceDataGetter = new InstanceData(require('request'));

instanceDataGetter.getRegion(function(err, region) {
	var ec2 = new Ec2({
		accessKeyId : argv.key || process.env.AWS_KEY,
		secretAccessKey : argv.secret || process.env.AWS_SECRET,
		region: region
	});

	var terminator = new Terminator(ec2, instanceDataGetter);

	terminator.terminateItself({}, function(err) {
		if (err) {
			console.log(err);
		}
	});
});