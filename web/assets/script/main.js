
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
			scene.toggleBackButton = function (toggle) {
				if (toggle) {
					$('#btnBack').css('display', 'inline');
				} else {
					$('#btnBack').css('display', 'none');
				}
			}
			scene.setAirportTitle = function (title) {
				$('#airport_title').text(title);
			}
		},
	])
})
