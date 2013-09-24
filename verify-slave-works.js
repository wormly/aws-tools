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

			if (rows.Slave_IO_Running == 'Yes' && rows.Slave_SQL_Running == 'Yes') {
				return cb("Slave IO and SQL threads are running");
			}

			if (rows.Seconds_Behind_Master < argv.behindLimit) {
				return cb("Seconds behind master is "+rows.Seconds_Behind_Master+" lt "+argv.behindLimit);
			}

			cb();
		});
	},

	function(cb) {
		var gunzip = zlib.createGunzip();
		request(argv.server, cb).pipe(gunzip).pipe(fs.createWriteStream(argv.tempfile));
	},

	function(r, body, cb) {
		headers = r.headers;

		cb();
	},

	function(cb) {
		db.query("stop slave", cb);
	},

	function(rows, opts, cb) {
		childProcess.exec('mysql -u'+argv.mysql.user+' -p'+argv.mysql.password+' -S'+argv.mysql.socketPath+' '+argv.db+' < '+argv.tempfile, cb)
	},

	function(rows, opts, cb) {
		var parsed = url.parse(argv.server);
		var hostname = parsed.hostname.replace('localhost', '127.0.0.1'); // if it's localhost, mysql will use socket no matter what

		db.query("change master to master_host = ?, master_user = ?, master_password = ?, master_port = ?", [hostname, headers['x-mysql-username'], headers['x-mysql-password'], argv.masterPort], cb);
	},

	function(rows, opts, cb) {
		db.query("start slave", cb);
	},

	function(rows, opts, cb) {
		fs.unlink(argv.tempfile, cb);
	}
], function(err) {
	if (err) console.log(err);

	db.end();
});

