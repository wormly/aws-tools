
var argv = require('optimist').argv;
var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var Iam = awssum.load('amazon/iam').Iam;

var Retrier = require('./lib/retrier.js');
var IamAgent = require('./lib/iamagent.js');

var iam = new Iam({
	accessKeyId : argv.key || process.env.AWS_KEY,
	secretAccessKey : argv.secret || process.env.AWS_SECRET,
	region: 'us-east-1'
	// region is irrelevant for IAM, but awssum requires this value to know the endpoint is not "us-gov" whatever that is
});

var agent = new IamAgent(iam);
var retrier = new Retrier(argv.attempts || 5);

retrier.run(function(callback) {
	agent.deletePolicy({
		policyName: argv.policyName,
		userName: argv.userName
	}, callback);
}, function(err, data) {
	if (err) {
		console.error(err);
	}
});