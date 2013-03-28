
var argv = require('optimist').argv;

var AWS = require('aws-sdk');

AWS.config.update({
	accessKeyId: process.env.AWS_KEY,
	secretAccessKey: process.env.AWS_SECRET,
	region: process.env.AWS_REGION,
	maxRetries: 1
});

var Retrier = require('./lib/retrier.js');
var EIPAgent = require('./lib/eipagent.js');
var InstanceData = require('./lib/instancedata.js');

var instanceDataGetter = new InstanceData(require('request'));

var retrier = new Retrier(argv.attempts || 5);

retrier.run(function(callback) {
	var ec2 = new AWS.EC2();

	var agent = new EIPAgent(ec2.client, instanceDataGetter);

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
