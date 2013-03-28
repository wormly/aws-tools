
var argv = require('optimist').argv;

var async = require('async');

var AWS = require('aws-sdk');

AWS.config.update({
	accessKeyId: process.env.AWS_KEY,
	secretAccessKey: process.env.AWS_SECRET,
	region: process.env.AWS_REGION
});

var Retrier = require('./lib/retrier.js');
var DNSUpdater = require('./lib/dnsupdater.js');

var route = new AWS.Route53();
var retrier = new Retrier(argv.attempts || 5);
var updater = new DNSUpdater(route.client);

retrier.run(function(callback) {
	updater.run({
		recordName: argv.name, // e.g. chef.dev.worm.ly., required
		ttl: argv.ttl || 600,
		ip: argv.ip // required
	}, callback);
}, function(err, data) {
	if (err) {
		console.error(err);
		process.exit(100);
	} else {
		console.log("Finished:", data);
	}
});