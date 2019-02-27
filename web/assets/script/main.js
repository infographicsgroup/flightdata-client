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
		var containerWidth  = Math.min(wrapperWidth,  Math.round(wrapperHeight*16/9));
		var containerHeight = Math.min(wrapperHeight, Math.round(wrapperWidth /16*9));

		$('#container').css({
			width: containerWidth,
			height: containerHeight,
			left: Math.round((wrapperWidth-containerWidth)/2),
			top: Math.round((wrapperHeight-containerHeight)/2),
			'font-size': containerHeight/100,
		})

		if (!scene) return;
		
		if (resizeTimeout) clearTimeout(resizeTimeout);
		resizeTimeout = setTimeout(scene.resize, 250);
	}

	$('#btn_globe').click(stateController.showGlobe)

	stateController.on('airport', function (airport) {
		if (airport) {
			$('#airport_title').text(airport.iata);
			$('#airport_text').html([
				airport.title,
				'near '+airport.city+'/'+airport.country,
				'',
				'passengers/year: '+(airport.passengersPerYear/1e6).toFixed(1)+'m'
			].join('<br>').toUpperCase());
			$('#airport_overlay').css('display', 'block');
		} else {
			$('#airport_title').text('');
			$('#airport_text').text('');
			$('#airport_overlay').css('display', 'none');
		}
	})

	stateController.on('intro', function (visible) {
		$('#text_intro').toggle(visible);
	})

	stateController.on('credit', function (visible) {
		$('#text_credit').toggle(visible);
	})

	stateController.on('colorMode', function (value) {
		$('#airport_colormode_0').toggle(value === 0);
		$('#airport_colormode_1').toggle(value === 1);
	})

	$('#switch').click(function () {
		$('#switch').toggleClass('right');
		stateController.setColorMode($('#switch').hasClass('right') ? 1 : 0)
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
			stateController.showAirport(airports[3]);
			cb();
		},
		function (cb) {
			resize();
			cb();
		},
	])
})
