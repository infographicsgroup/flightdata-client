$(function () {
	var scene;

	helper.series([
		function (cb) {
			Scene($('#wrapper_canvas'), $('#canvas'), function (_scene) {
				scene = _scene;
				cb();
			});
		},
		function (cb) {
			scene.addGlobe(cb);
		},
		function (cb) {
			scene.addAirports(cb);
		},
	])
})