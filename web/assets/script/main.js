"use strict"

document.addEventListener('touchmove', function(e) { e.preventDefault(); }, {passive:false});

var FlightGlobal = {};

$(function () {
	var scene;

	FlightGlobal.helper.series([
		function (cb) {
			scene = new FlightGlobal.Scene($('#wrapper_canvas'));
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
	])
})
