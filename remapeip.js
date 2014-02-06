
var argv = require('optimist').argv;
var AWS = require('aws-sdk');
var Retrier = require('./lib/retrier.js');
var EIPAgent = require('./lib/eipagent.js');

AWS.config.update({
	accessKeyId: process.env.AWS_KEY,
	secretAccessKey: process.env.AWS_SECRET,
	region: process.env.AWS_REGION
});

var retrier = new Retrier(argv.attempts || 5);

var ec2 = new AWS.EC2();

retrier.wrap(ec2.client, ['associateAddress']);

var agent = new EIPAgent(ec2.client);

retrier.run(function(callback) {
	agent.remapEIP({
		ip: argv.ip,
		instance: argv.instance
	}, callback);
}, function(err) {
	if (err) {
		console.error(err);
		process.exit(100);
	}
});
