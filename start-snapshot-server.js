
var argv = require('optimist').
	default('port', 2014).
	default('password', 't9s5o97bdw75jyvi').
	argv;

// http://localhost:2014/snapshots/43200/Chef|Stora%20%2Fmysqldata_.|dbslavesnapshots
// curl -v -H 'X-API-Password: t9s5o97bdw75jyvi' 'http://chefj4.dev.worm.ly:2014/snapshots/43200/Chef|Stora%20%2Fmysqldata_.|dbslavesnapshots'

var express = require('express');

var Retrier = require('./lib/retrier.js');
var SnapshotFinder = require('./lib/snapshotfinder.js');
var AWS = require('aws-sdk');

AWS.config.update({
	accessKeyId: process.env.AWS_KEY,
	secretAccessKey: process.env.AWS_SECRET,
	region: process.env.AWS_REGION
});

var ec2 = new AWS.EC2();

var finder = new SnapshotFinder(ec2);

var app = express();

app.set('json spaces', 2);

app.get('/snapshots/:maxage/:regexp', function(req, res) {
	if (req.headers.host.indexOf('localhost') == -1 && req.headers['x-api-password'] != argv.password) {
		return res.send(403, "Wrong api password");
	}
	
	var regexp = new RegExp(req.params.regexp, 'i');
	
	finder.findSnapshot({
		regexp: regexp,
		returnAll: true
	}, function(err, snapshots) {
		// bad starttime returned?

		var seenTags = [];
		var matchingSnapshots = [];
		
		snapshots.forEach(function(snapshot) {
			var tag = snapshot.Description.match(regexp)[0];
			
			if (seenTags.indexOf(tag) > -1) return;
			seenTags.push(tag);
			
			var now = Math.round(Date.now() / 1000);
			var start = Math.round(snapshot.StartTime.getTime() / 1000);
			var age = now - start;
			var badAge = age > req.params.maxage;

			matchingSnapshots.push({
				SnapshotId: snapshot.SnapshotId,
				VolumeId: snapshot.VolumeId,
				State: snapshot.State,
				Description: snapshot.Description,
				StartTime: snapshot.StartTime,
				_age: age,
				_badAge: badAge 
			});
		});
		
		res.json(200, {
			total: matchingSnapshots.length,
			snapshots: matchingSnapshots
		});
	});
});

app.listen(argv.port, function() {
	console.log('Started on', argv.port);
});
