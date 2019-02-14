
document.addEventListener('touchmove', function(e) { e.preventDefault(); }, {passive:false});

$(function () {
	var scene;

	helper.series([
		function (cb) {
			Scene($('#wrapper_canvas'), function (_scene) {
				scene = _scene;
				cb();
			});
		},
		function (cb) {
			scene.addAirports(cb);
		},
		function (cb) {
			$('#btnBack').click(function () {
				scene.closeAirport();
			})
			scene.setAirport = function (airport) {
				if (airport) {
					$('#airport_title').text(airport.name);
					$('#btnBack').css('display', 'inline');
				} else {
					$('#airport_title').text('');
					$('#btnBack').css('display', 'none');
				}
			}
		},
	])
})
