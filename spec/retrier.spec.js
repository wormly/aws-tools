
require('./utils.js');

describe('Retrier', function() {
	var Retrier = require('../lib/retrier.js');

	var retrier, attempts = 3, runCallback, resultCallback;

	beforeEach(function() {
		runCallback = jasmine.createSpy();
		resultCallback = jasmine.createSpy();
		retrier = new Retrier(attempts);
	});

	it('retries to success', function() {
		retrier.run(runCallback, resultCallback);

		expect(runCallback.callCount).toEqual(1);
		expect(resultCallback.callCount).toEqual(0);

		runCallback.mostRecentCall.args[0]('err');

		expect(runCallback.callCount).toEqual(1);
		expect(resultCallback.callCount).toEqual(0);

		tick(5000);

		expect(runCallback.callCount).toEqual(2);
		runCallback.mostRecentCall.args[0](null, 'data');

		expect(runCallback.callCount).toEqual(2);
		expect(resultCallback.callCount).toEqual(1);

		expect(resultCallback).toHaveBeenCalledWith(null, 'data');
	});

	it('retries to error', function() {
		retrier.run(runCallback, resultCallback);

		runCallback.mostRecentCall.args[0]('err');
		tick(5000);
		runCallback.mostRecentCall.args[0]('err');
		tick(10000);

		expect(resultCallback.callCount).toEqual(0);

		runCallback.mostRecentCall.args[0]('err');

		expect(resultCallback.callCount).toEqual(1);

		expect(resultCallback).toHaveBeenCalledWith('Attempts exceeded');
	});
});