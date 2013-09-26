var optimist = require('optimist').
	demand(['mysql', 'server']).
	default('tempfile', '/tmp/fetched.sql').
	default('behindLimit', 5 * 60).
	default('masterPort', 3307).
	alias('h', 'help').
	default('db', 'wormlynew');

var argv = optimist.argv;

if (argv.help) {
	optimist.showHelp();
	process.exit(0);
}

var async = require('async');
var request = require('request');
var mysql = require('mysql');
var fs = require('fs');
var zlib = require('zlib');
var childProcess = require('child_process');
var url = require('url');

var db = mysql.createConnection(argv.mysql);
var headers;

async.waterfall([
	function(cb) {
		db.query("show slave status", function(err, rows) {
			if (err) return cb(err);

			var status = rows[0];

			if (status && status.Slave_IO_Running == 'Yes' && status.Slave_SQL_Running == 'Yes' && status.Seconds_Behind_Master < argv.behindLimit) {
				return cb("Slave IO and SQL threads are running, behind_master is "+status.Seconds_Behind_Master);
			}

			cb();
		});
	},

	function(cb) {
		console.log('Stopping slave');
		db.query("stop slave", cb);
	},

	function(rows, opts, cb) {
		console.log('Resetting slave');
		db.query("reset slave", cb);
	},

	function(rows, opts, cb) {
		console.log('Getting dump');

		var gunzip = zlib.createGunzip();

		request(argv.server, function(e, r, body) {
			if (e) cb(e);

			headers = r.headers;
		}).pipe(gunzip).pipe(fs.createWriteStream(argv.tempfile)).on('close', cb);
	},

	function(cb) {
		console.log('Loading dump');
		childProcess.exec('mysql -u'+argv.mysql.user+' -p'+argv.mysql.password+' -S'+argv.mysql.socketPath+' '+argv.db+' < '+argv.tempfile, cb)
	},

	function(stdout, stderr, cb) {
		var parsed = url.parse(argv.server);

		console.log('Changing master');
		db.query("change master to master_host = ?, master_user = ?, master_password = ?, master_port = ?", [parsed.hostname, headers['x-mysql-username'], headers['x-mysql-password'], argv.masterPort], cb);
	},

	function(rows, opts, cb) {
		console.log('Starting slave');
		db.query("start slave", cb);
	},

	function(rows, opts, cb) {
		console.log('Deleting dump');
		fs.unlink(argv.tempfile, cb);
	}
], function(err) {
	if (err) console.log(err);

	db.end();
});

