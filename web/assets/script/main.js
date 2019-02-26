"use strict"

document.addEventListener('touchmove', function(e) { e.preventDefault(); }, {passive:false});

var FlightGlobal = {};

$(function () {
	var scene;

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


	FlightGlobal.helper.series([
		function (cb) {
			scene = new FlightGlobal.Scene($('#wrapper_canvas'));
			scene.resize();
			cb();
		},
		function (cb) {
			scene.addAirportMarkers(cb);
		},
		function (cb) {
			$('#btnBack').click(function () {
				scene.closeAirport();
			})

			$('#airport_colormode input').change(updateColormode);
			updateColormode();
			function updateColormode() {
            scene.setColormode($('#airport_colormode input:checked').val());
			}

			scene.onAirport = function (airport) {
				if (airport) {
					$('#airport_title').text(airport.name);
					$('#airport_overlay').css('display', 'block');
				} else {
					$('#airport_title').text('');
					$('#airport_overlay').css('display', 'none');
				}
			}
		},
		function (cb) {
			resize();
		}
	])
})
