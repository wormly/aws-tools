
var argv = require('optimist').argv;
var AWS = require('aws-sdk');
var Retrier = require('./lib/retrier.js');
var EIPAgent = require('./lib/eipagent.js');

require('./update-config.js');

var retrier = new Retrier(argv.attempts || 5);

var ec2 = new AWS.EC2();

retrier.wrap(ec2, ['associateAddress']);

var agent = new EIPAgent(ec2);

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
