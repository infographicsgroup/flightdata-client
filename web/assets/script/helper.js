"use strict"

FlightGlobal.helper = (function () {
	return {
		series:series,
		diffDecoding:diffDecoding,
	}

	function series(list) {
		var todos = list.slice(0);
		run();
		function run() {
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

})()
