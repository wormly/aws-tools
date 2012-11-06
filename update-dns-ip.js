
var argv = require('optimist').argv;

var async = require('async');
var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var Route53 = awssum.load('amazon/route53').Route53;

var Retrier = require('./lib/retrier.js');
var DNSUpdater = require('./lib/dnsupdater.js');
var InstanceData = require('./lib/instancedata.js');

var instanceDataGetter = new InstanceData(require('request'));

instanceDataGetter.getRegion(function(region) {
	var route = new Route53({
		accessKeyId : argv.key || process.env.AWS_KEY,
		secretAccessKey : argv.secret || process.env.AWS_SECRET,
		region : region
	});

	var retrier = new Retrier(argv.attempts || 5);
	var updater = new DNSUpdater(route);

	retrier.run(function(callback) {
		updater.run({
			recordName: argv.name, // e.g. chef.dev.worm.ly., required
			ttl: argv.ttl || 600,
			ip: argv.ip // required
		}, callback);
	}, function(err, data) {
		console.log("Finished:", err, data);
	});
});