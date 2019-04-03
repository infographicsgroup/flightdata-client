"use strict"

FlightGlobal.helper = (function () {
	return {
		series:series,
		diffDecoding:diffDecoding,
		touchEvents:checkTouchEvents(),
	}

	function series(list) {
		var todos = list.slice(0);
		run();
		function run() {
			if (todos.length === 0) return;
			todos.shift()(function () {
				setTimeout(run, 0);
			})
		}
	}

	function diffDecoding(data, stepSize) {
		var n = data.length;
		for (var i = stepSize; i < n; i++) {
			data[i] += data[i-stepSize];
		}
	}

	function checkTouchEvents() {
		var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
		var mq = function(query) {
			return window.matchMedia(query).matches;
		}

		if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
			return true;
		}

		// include the 'heartz' as a way to have a non matching MQ to help terminate the join
		// https://git.io/vznFH
		var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
		return mq(query);
	}
})()
