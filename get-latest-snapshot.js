
var argv = require('optimist').argv;

var filterRegexp = new RegExp(argv.regexp, 'i');
var attempts = argv.attempts || 5;

var ec2 = require('aws2js').load('ec2', argv.key, argv.secret);
ec2.setRegion(argv.region || 'eu-west-1');

var request = function (attempt) {
	if (attempt > attempts) {
		process.exit(1);
	}

	ec2.request("DescribeSnapshots", {}, function (err, result) {
		if (err) {
			console.log(err);
			console.log("Waiting", attempt * 5, "sec");
			setTimeout(request.bind(null, attempt + 1), attempt * 5000);
			return;
		}

		var items = result.snapshotSet.item;

		items = items.filter(function (item) {
			if (item.status !== 'completed') {
				return false;
			}

			return filterRegexp.test(item.description);
		});

		items = items.sort(function (a, b) {
			return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
		});

		console.log(items[0].snapshotId);
	});
};

request(1);