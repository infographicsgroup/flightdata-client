"use strict"

FlightGlobal.Animation = function () {
	var alreadyRun = false;
	var startTime, globe;
	var finger1node = $('#finger1');
	var finger2node = $('#finger2');

	var keys = 'x,y,w,o'.split(',');
	var finger1 = {x:39,y:35,w:10,o:0};
	var finger2 = {x:40,y:35,w:8,o:0};
	var time = 0;
	var timeline = [
		[{},{},0],
		[{},{},1000],
		[{x:40,w:8,o:1}, {}, 500],
		[{}, {o:1}, 100],
		[{x:60}, {x:60}, 1000],
		[{}, {o:0}, 100],
		[{x:59,w:10,o:0}, {}, 500],
	];
	timeline.forEach(function (entry) {
		keys.forEach(function (key) {
			finger1[key] = entry[0][key] = (entry[0][key] === undefined) ? finger1[key] : entry[0][key];
			finger2[key] = entry[1][key] = (entry[1][key] === undefined) ? finger2[key] : entry[1][key];
		})
		time = entry[2] = entry[2]+time;
	})

	return function (_globe) {
		globe = _globe;
		if (alreadyRun) return;
		alreadyRun = true;
		start();

		setTimeout(function () {
			document.addEventListener('mousedown', stop);
			document.addEventListener('touchstart', stop);
		}, 500);
	}

	function stop() {
		alreadyRun = true;
		startTime = -1e10;
		finger1node.remove();
		finger2node.remove();
	}

	function start() {
		startTime = Date.now();
		var lastTime = 0;

		finger1node.css({display:'block', opacity:0});
		finger2node.css({display:'block', opacity:0});

		requestAnimationFrame(step);

		function step() {
			var time = Date.now() - startTime;

			var entryIndex = false;
			for (var i = timeline.length-1; i >= 0; i--) {
				if (timeline[i][2] > time) entryIndex = i;
			}

			if (!entryIndex) return stop();

			var entry0 = timeline[entryIndex-1];
			var entry1 = timeline[entryIndex];
			var alpha = (time - entry0[2])/(entry1[2] - entry0[2]);
			var dAlpha = Math.sin(alpha*Math.PI);
			alpha = 0.5*(1-Math.cos(alpha*Math.PI));

			if ((entry1[1].x - entry0[1].x) !== 0) {
				globe.rotateLeft(0.01*dAlpha/(time-lastTime));
			}

			finger1node.css({
				left:(entry0[0].x + (entry1[0].x - entry0[0].x)*alpha).toFixed(3)+'em',
				top:(entry0[0].y + (entry1[0].y - entry0[0].y)*alpha).toFixed(3)+'em',
				width:(entry0[0].w + (entry1[0].w - entry0[0].w)*alpha).toFixed(3)+'em',
				opacity:(entry0[0].o + (entry1[0].o - entry0[0].o)*alpha).toFixed(3),
			})

			finger2node.css({
				left:(entry0[1].x + (entry1[1].x - entry0[1].x)*alpha).toFixed(3)+'em',
				top:(entry0[1].y + (entry1[1].y - entry0[1].y)*alpha).toFixed(3)+'em',
				width:(entry0[1].w + (entry1[1].w - entry0[1].w)*alpha).toFixed(3)+'em',
				opacity:(entry0[1].o + (entry1[1].o - entry0[1].o)*alpha).toFixed(3),
			})

			lastTime = time;
			requestAnimationFrame(step);
		}
	}
}
