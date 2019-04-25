"use strict"

document.addEventListener('touchmove', function(e) { e.preventDefault(); }, {passive:false});

var FlightGlobal = {};

$(function () {
	var scene, airports, containerWidth, containerHeight;
	var runAnimation = FlightGlobal.Animation(scene);

	var touchEvents = FlightGlobal.helper.touchEvents;
	if (touchEvents) $('body').addClass('nohover');

	var resizeTimeout = false;
	
	$(window).resize(suggestResize);
	forceResize();

	function suggestResize() {
		if (resizeTimeout) clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(forceResize, 100);
	}

	function forceResize() {
		var wrapperWidth  = $('#wrapper_container').innerWidth();
		var wrapperHeight = $('#wrapper_container').innerHeight();
		var minSize = Math.min(wrapperWidth/16, wrapperHeight/9)
		var newContainerWidth  = Math.round(minSize*16);
		var newContainerHeight = Math.round(minSize* 9);

		$('#container').css({
			width: newContainerWidth,
			height: newContainerHeight,
			left: Math.round((wrapperWidth-newContainerWidth)/2),
			top: Math.round((wrapperHeight-newContainerHeight)/2),
			'font-size': newContainerWidth/100,
		})

		if (!scene) return;

		if ((containerWidth === newContainerWidth) && (containerHeight === newContainerHeight)) return;

		containerWidth  = newContainerWidth;
		containerHeight = newContainerHeight;
		scene.resize();
	}

	function init() {
		stateController.on('airportLegend', function (visible) {
			if (visible) {
				var airport = stateController.get('airport');
				$('#airport_title').text(airport.iata);
				$('#airport_text').html([
					airport.title.toUpperCase(),
					('near '+airport.city+', '+airport.country).toUpperCase(),
					'',
					'passengers/year: '+(airport.passengersPerYear/1e6).toFixed(1)+'m'
				].join('<br>'));
			}
			if (visible) {
				$('#airport_overlay').fadeIn(500);
			} else {
				$('#airport_overlay').fadeOut(500);
			}
		}, true);

		stateController.on('globeLegend', function (visible) {
			if (visible) {
				$('#globe_overlay').fadeIn(500);
			} else {
				$('#globe_overlay').fadeOut(500);
			}
		}, true);

		stateController.on('intro', function (visible) {
			$('#wrapper_canvas').css('pointer-events', visible || stateController.get('credits') ? 'none' : 'auto');

			if (visible) {
				$('#intro_overlay').fadeIn(500);
			} else {
				$('#intro_overlay').fadeOut(500);
				if (!stateController.get('credits')) runAnimation(scene.globe);
			}
		}, true);

		stateController.on('credits', function (visible, wasVisible) {
			$('#wrapper_canvas').css('pointer-events', visible || stateController.get('intro') ? 'none' : 'auto');

			if (visible) {
				$('#credits_overlay').fadeIn(500);
			} else {
				$('#credits_overlay').fadeOut(500);
				if (wasVisible) runAnimation(scene.globe);
			}
		}, true);

		stateController.on('colorMode', function (value) {
			$('#airport_colormode_0').toggle(value === 0);
			$('#airport_colormode_1').toggle(value === 1);
		}, true);

		var clickEventName = touchEvents ? 'touchstart' : 'click';

		$('#switch').on(clickEventName, function () {
			$('#switch').toggleClass('right');
			stateController.set({colorMode:$('#switch').hasClass('right') ? 1 : 0})
		})

		$('#btn_play').on(clickEventName, function () {
			stateController.set({intro:false, globeLegend:true})
		})

		$('#btn_credits,#btn_close_credits').on(clickEventName, function () {
			stateController.set({credits:!stateController.get('credits'), intro:false})
		})

		if (document.getElementById('wrapper_container').requestFullscreen) {
			$('#btn_fullscreen').on(clickEventName, function () {
				var wrapper = document.getElementById('wrapper_container');
				if (!document.fullscreenElement) {
					wrapper.requestFullscreen();
				} else {
					if (document.exitFullscreen) document.exitFullscreen();
				}
			})
		} else {
			$('#btn_fullscreen').remove();
		}

		$('#btn_globe').on(clickEventName, function () {
			stateController.set({airport:false})
		})
	}

	FlightGlobal.helper.series([
		function (cb) {
			$('#wrapper_html').css('display', 'block');
			$('#intro_overlay').css('display', 'block');
			setTimeout(cb, 10);
		},
		function (cb) {
			scene = new FlightGlobal.Scene($('#wrapper_canvas'));
			scene.resize();

			$('#airport_colormode input').change(updateColormode);
			
			updateColormode();

			function updateColormode() {
				scene.setColormode($('#airport_colormode input:checked').val());
			}

			init();

			cb();
		},
		function (cb) {
			$.getJSON('assets/data/airports.json', function (_airports) {
				airports = _airports;
				airports.forEach(function (airport) {
					airport.next.forEach(function (next) {
						next[0] = airports[next[0]];
					})
				})
				scene.addAirportMarkers(airports);
				cb();
			})
		},
		function (cb) {
			cb();
		},
		function (cb) {
			resize();
			cb();
		},
	])
})
