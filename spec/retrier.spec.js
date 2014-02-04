
require('./utils.js');

describe('Retrier', function() {
	var Retrier = require('../lib/retrier.js');

	var retrier, attempts = 3, runCallback, resultCallback, baseTimeout = 1000;

	beforeEach(function() {
		jasmine.Clock.useMock();

		runCallback = jasmine.createSpy();
		resultCallback = jasmine.createSpy();
		retrier = new Retrier(attempts, baseTimeout);
	});

	it('wraps', function() {
		var testObj = {
			postEc: runCallback
		};

		retrier.wrap(testObj, ['postEc']);

		var request = 'request!';

		testObj.postEc(request, resultCallback);

		expect(resultCallback).not.toHaveBeenCalled();
		expect(runCallback.mostRecentCall.args[0]).toEqual(request);

		runCallback.mostRecentCall.args[1]('could not do!');

		jasmine.Clock.tick(baseTimeout);

		expect(runCallback.callCount).toEqual(2);
		expect(runCallback.mostRecentCall.args[0]).toEqual(request);

		expect(resultCallback).not.toHaveBeenCalled();

		runCallback.mostRecentCall.args[1](null, 'results');

		expect(resultCallback).toHaveBeenCalledWith(null, 'results');
	});

	it('retries to success', function() {
		retrier.run(runCallback, resultCallback);

		expect(runCallback.callCount).toEqual(1);
		expect(resultCallback.callCount).toEqual(0);

		runCallback.mostRecentCall.args[0]('err');

		expect(runCallback.callCount).toEqual(1);
		expect(resultCallback.callCount).toEqual(0);

		jasmine.Clock.tick(baseTimeout);

		expect(runCallback.callCount).toEqual(2);
		runCallback.mostRecentCall.args[0](null, 'data');

		expect(runCallback.callCount).toEqual(2);
		expect(resultCallback.callCount).toEqual(1);

		expect(resultCallback).toHaveBeenCalledWith(null, 'data');
	});

	it('retries to error', function() {
		retrier.run(runCallback, resultCallback);

		runCallback.mostRecentCall.args[0]('err');
		jasmine.Clock.tick(baseTimeout);
		runCallback.mostRecentCall.args[0]('err');
		jasmine.Clock.tick(baseTimeout * 2);

		expect(resultCallback.callCount).toEqual(0);

		runCallback.mostRecentCall.args[0]('err');

		expect(resultCallback.callCount).toEqual(1);

		expect(resultCallback).toHaveBeenCalledWith('Attempts exceeded');
	});
});