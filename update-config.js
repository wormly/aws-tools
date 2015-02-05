
var AWS = require('aws-sdk');
var argv = require('optimist').argv;

AWS.config.update({
	accessKeyId: process.env.AWS_KEY,
	secretAccessKey: process.env.AWS_SECRET,
	region: argv.region || process.env.AWS_REGION,
	httpOptions: {
		timeout: 300000
	}
});