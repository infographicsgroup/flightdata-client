"use strict"

document.addEventListener('touchmove', function(e) { e.preventDefault(); }, {passive:false});

var FlightGlobal = {};

$(function () {
	var scene, airports;

	var resizeTimeout = false;
	$(window).resize(resize);
	resize();
	function resize() {
		var wrapperWidth  = $('#wrapper_container').innerWidth();
		var wrapperHeight = $('#wrapper_container').innerHeight();
		var minSize = Math.min(wrapperWidth/16, wrapperHeight/9)
		var containerWidth  = Math.round(minSize*16);
		var containerHeight = Math.round(minSize* 9);

		$('#container').css({
			width: containerWidth,
			height: containerHeight,
			left: Math.round((wrapperWidth-containerWidth)/2),
			top: Math.round((wrapperHeight-containerHeight)/2),
			'font-size': containerWidth/100,
		})

		if (!scene) return;
		
		if (resizeTimeout) clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(scene.resize, 250);
	}

	$('#btn_globe').click(function () {
		stateController.set({airport:false})
	})

	stateController.on('airportLegend', function (visible) {
		if (visible) {
			var airport = stateController.get('airport');
			$('#airport_title').text(airport.iata);
			$('#airport_text').html([
				airport.title,
				'near '+airport.city+'/'+airport.country,
				'',
				'passengers/year: '+(airport.passengersPerYear/1e6).toFixed(1)+'m'
			].join('<br>').toUpperCase());
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

	stateController.on('credit', function (visible) {
		if (visible) {
			$('#text_credit').fadeIn(500);
		} else {
			$('#text_credit').fadeOut(500);
		}
	}, true);

	stateController.on('colorMode', function (value) {
		$('#airport_colormode_0').toggle(value === 0);
		$('#airport_colormode_1').toggle(value === 1);
	}, true);

	$('#switch').click(function () {
		$('#switch').toggleClass('right');
		stateController.set({colorMode:$('#switch').hasClass('right') ? 1 : 0})
	})

	FlightGlobal.helper.series([
		function (cb) {
			scene = new FlightGlobal.Scene($('#wrapper_canvas'));
			scene.resize();

			$('#wrapper_html').css('display', 'block');

			$('#airport_colormode input').change(updateColormode);
			updateColormode();
			function updateColormode() {
				scene.setColormode($('#airport_colormode input:checked').val());
			}

			cb();
		},
		function (cb) {
			$.getJSON('assets/data/airports.json', function (_airports) {
				airports = _airports;
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
