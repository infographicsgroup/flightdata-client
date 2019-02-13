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
	])
})