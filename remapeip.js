
var argv = require('optimist').argv;

var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var Ec2 = awssum.load('amazon/ec2').Ec2;

var Retrier = require('./lib/retrier.js');
var EIPAgent = require('./lib/eipagent.js');
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

		var agent = new EIPAgent(ec2, instanceDataGetter);
		agent.remapEIP({
			ip: argv.ip
		}, callback);
	});
}, function(err) {
	if (err) {
		console.error(err);
		process.exit(100);
	}
});
