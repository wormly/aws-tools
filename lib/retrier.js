
module.exports = Retrier;

var async = require('async');

function Retrier(attempts) {
	this._attempts = attempts;
}

Retrier.prototype.run = function(runCallback, callback) {
	var request = function (attempt) {
		runCallback(function(err, data) {
			if (err) {
				if (attempt === this._attempts) {
					callback("Attempts exceeded");
				} else {
					setTimeout(request.bind(this, attempt + 1), attempt * 5000);
				}
			} else {
				callback(null, data);
			}
		}.bind(this));
	}.bind(this);

	request(1);
};