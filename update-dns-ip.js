
var argv = require('optimist').argv;
var async = require('async');
var AWS = require('aws-sdk');
var Retrier = require('./lib/retrier.js');
var DNSUpdater = require('./lib/dnsupdater.js');

require('./update-config.js');

var route = new AWS.Route53();
var retrier = new Retrier(argv.attempts || 5);
var updater = new DNSUpdater(route);

retrier.run(function(callback) {
	updater.run({
		recordName: argv.name, // e.g. chef.dev.worm.ly., required
		ttl: argv.ttl || 600,
		ip: argv.ip, // required
		type: argv.type || undefined,
		zone: argv.zone || undefined 
	}, callback);
}, function(err, data) {
	if (err) {
		console.error(err);
		process.exit(100);
	} else {
		console.log("Finished:", data);
	}
});