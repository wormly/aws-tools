var argv = require('optimist').
	demand(['user', 'password', 'socket', 'server']).
	default('tempfile', '/tmp/fetched.sql').
	default('db', 'wormlynew').
	argv;

var async = require('async');
var request = require('request');
var mysql = require('mysql');
var fs = require('fs');
var zlib = require('zlib');
var childProcess = require('child_process');
var url = require('url');

var db = mysql.createConnection(argv);
var headers;

async.waterfall([
	function(cb) {
		db.query("show slave status", function(err, rows) {
			if (rows.Slave_IO_Running == 'Yes' && rows.Slave_SQL_Running == 'Yes') {
				return cb("Slave IO and SQL threads are running");
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
		childProcess.exec('mysql -u'+argv.user+' -p'+argv.password+' -S'+argv.socket+' '+argv.db+' < '+argv.tempfile, cb)
	},

	function(rows, opts, cb) {
		var parsed = url.parse(argv.server);

		db.query("change master to master_host = ?, master_user = ?, master_password = ?", [parsed.hostname, headers['x-mysql-username'], headers['x-mysql-password']], cb);
	},

	function(rows, opts, cb) {
		db.query("start slave", cb);
	},

	function(cb) {
		fs.unlink(argv.tempfile, cb);
	}
], function(err) {
	if (err) console.log(err);

	db.end();
});

