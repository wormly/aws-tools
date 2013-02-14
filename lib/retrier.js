
module.exports = Retrier;

var async = require('async');

function Retrier(attempts, baseTimeout) {
	this._attempts = attempts;
	this._baseTimeout = baseTimeout || 5000;
}

Retrier.prototype.run = function(runCallback, callback) {
	var request = function (attempt) {
		runCallback(function(err, data) {
			if (err) {
				if (attempt === this._attempts) {
					callback("Attempts exceeded");
				} else {
					setTimeout(request.bind(this, attempt + 1), attempt * this._baseTimeout);
				}
			} else {
				callback(null, data);
			}
		}.bind(this));
	}.bind(this);

	request(1);
};