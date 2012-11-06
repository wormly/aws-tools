
var _ = require('underscore');
var sinon = require('sinon');
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

var clock = sinon.clock.create();

['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'tick'].forEach(function(name) {
	global[name] = clock[name].bind(clock);
});