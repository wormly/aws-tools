
var argv = require('optimist').argv;

var filterRegexp = new RegExp(argv.regexp, 'i');
var attempts = argv.attempts || 5;

var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var Ec2 = awssum.load('amazon/ec2').Ec2;

var ec2 = new Ec2({
	accessKeyId : argv.key || process.env.AWS_KEY,
	secretAccessKey : argv.secret || process.env.AWS_SECRET,
	region : argv.region || 'eu-west-1'
});

var request = function (attempt) {
	if (attempt > attempts) {
		process.exit(1);
	}

	ec2.DescribeSnapshots({
		Filter : [{
			Name : 'status',
			Value : [ 'completed' ]
		}]
	}, function (err, result) {
		if (err) {
			console.log(err.Body.ErrorResponse);
			console.log("Waiting", attempt * 5, "sec");
			setTimeout(request.bind(null, attempt + 1), attempt * 5000);
			return;
		}

		var items = result.Body.DescribeSnapshotsResponse.snapshotSet.item;

		items = items.filter(function (item) {
			return filterRegexp.test(item.description);
		});

		items = items.sort(function (a, b) {
			return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
		});

		console.log(items[0].snapshotId, items[0].volumeSize);
	});
};

request(1);
