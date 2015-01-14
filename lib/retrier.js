
module.exports = Retrier;

var async = require('async');
var util = require('util');

function Retrier(attempts, baseTimeout, runTimeout) {
	this._attempts = attempts;
	this._baseTimeout = baseTimeout || 5000;
	this._runTimeout = runTimeout || 150000;
}

/**
 * Calls runCallback with no arguments, passes one callback expecting (err, data), if err is true, runs runCallback again
 *
 * @param runCallback
 * @param callback
 */
Retrier.prototype.run = function(runCallback, callback) {
	var request = function (attempt) {
		var timedOut = false;
		
		var timeout = setTimeout(function() {
			timedOut = true;
			
			setTimeout(request.bind(this, attempt + 1), 1);
		}.bind(this), this._runTimeout);
		
		runCallback(function(err, data) {
			if (timedOut) return;

			clearTimeout(timeout);
			
			if (err) {
				if (attempt === this._attempts) {
					callback("Attempts exceeded");
				} else {
					console.error("Error", util.inspect(err, false, 10));
					setTimeout(request.bind(this, attempt + 1), attempt * this._baseTimeout);
				}
			} else {
				callback(null, data);
			}
		}.bind(this));
	}.bind(this);

	request(1);
};

/**
 * Replaces listed method with ones that will retry on error. All methods should be called with (request, cb) and call cb with (err, data)
 * @param obj
 * @param methods
 */
Retrier.prototype.wrap = function(obj, methods) {
	var retrier = this;

	methods.forEach(function(method) {
		var original = obj[method].bind(obj);

		obj[method] = function(request, finalCallback) {
			retrier.run(function(callback) {
				original(request, callback);
			}, finalCallback);
		};
	});
};