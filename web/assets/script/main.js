
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

			$('#airport_colormode input').change(updateColormode);
			updateColormode();
			function updateColormode() {
            scene.setColormode($('#airport_colormode input:checked').val());
			}

			scene.setAirport = function (airport) {
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
