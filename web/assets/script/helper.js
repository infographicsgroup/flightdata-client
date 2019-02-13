

helper = (function () {
	return {
		series:series
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

})()
	

