
var AWS = require('aws-sdk');

AWS.config.update({
	accessKeyId: process.env.AWS_KEY,
	secretAccessKey: process.env.AWS_SECRET,
	region: process.env.AWS_REGION,
	httpOptions: {
		timeout: 120000
	}
});