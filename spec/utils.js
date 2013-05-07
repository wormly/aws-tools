
var _ = require('underscore');
var EventEmitter = require('events').EventEmitter;

global.stub = function () {
	var args = _.values(arguments);
	var emitterRequested = typeof args[0] == 'boolean' && args.shift();

	var object = emitterRequested ? new EventEmitter() : {};

	args.forEach(function(method) {
		object[method] = function() {};
		spyOn(object, method);
	});

	return object;
};

global.throws = function(what) {
	return function() {
		throw what;
	};
};

