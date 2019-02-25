"use strict"

FlightGlobal.Airport = function (airport) {
	var curves, flightData;
	var colormode = 'takeoff';

	var me = {
		destroy: destroy,
		setColormode: setColormode,
	}

	init();

	return me;

	function destroy() {
		me.object3D.parent.remove(me.object3D);
	}

	function init() {
		me.object3D = new THREE.Group();

		me.object3D.rotation.set(Math.PI/2,0,0);
		me.object3D.visible = true;

		me.control = new THREE.TrackballControls(me.object3D);
		me.control.dynamicDampingFactor = 0.99;
		me.control.minAngle = -Math.PI/2;
		me.control.maxAngle =  Math.PI/2;
		me.control.rotateSpeed = 5;

		var planeSize = 2*4096/3840;
		var geometry = new THREE.PlaneGeometry(planeSize, planeSize);
		var mapMaterial = new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader().load('assets/map/'+airport.name+'.png'),
			transparent: true,
		});
		mapMaterial.map.encoding = THREE.sRGBEncoding;
		var mapObject = new THREE.Mesh(geometry, mapMaterial);
		mapObject.rotation.set(-Math.PI/2,0,0);
		mapObject.position.set(0,-0.2,0);
		me.object3D.add(mapObject);

		curves = new THREE.Group();
		curves.rotation.set(-Math.PI/2,0,0);
		curves.position.set(0,-0.2,0);
		me.object3D.add(curves);

		var buffer;
		flightData = false;

		$.getJSON('assets/data/airports/'+airport.name+'.json', function (data) {
			flightData = oa2ao(data);
			checkFlightData();
		})

		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'assets/data/airports/'+airport.name+'.bin', true);
		xhr.responseType = 'arraybuffer';
		xhr.onload = function(e) {
			buffer = new Int16Array(this.response); 
			checkFlightData();
		};
		xhr.send();

		function checkFlightData() {
			if (!flightData) return;
			if (!buffer) return;

			FlightGlobal.helper.diffDecoding(buffer, 3);

			flightData.forEach(function (flight) {
				var path = [];
				var i0 = flight.pos0;
				var i1 = flight.pos1;
				for (var i = i0; i < i1; i += 3) {
					path.push(new THREE.Vector3(
						buffer[i+0]/4000*2.1,
						buffer[i+1]/4000*2.1,
						buffer[i+2]/4000*1
					))
				}
				flight.segments = path;
			})

			flightData.forEach(function (flight) {
				var curve = new THREE.CatmullRomCurve3(flight.segments);
				var points = curve.getPoints(flight.segments.length*3);
				var cmlgeometry = new THREE.BufferGeometry().setFromPoints(points);

				var material = new THREE.LineBasicMaterial({
					color: '#000000',
					transparent: true,
					opacity: 0.3,
					blending: THREE.AdditiveBlending,
				});
				flight.material = material;

				var curveObject = new THREE.Line(cmlgeometry, material);

				curves.add(curveObject)
			})

			updateColormode();
		}
	}

	function updateColormode() {
		if (!flightData) return;
		switch (colormode) {
			case 'takeoff': 
				flightData.forEach(function (flight) {
					flight.material.color = new THREE.Color(flight.takeOff ? '#33ddff' : '#ffff33');
				})
			break;
			case 'destination': 
				flightData.forEach(function (flight) {
					flight.material.color = new THREE.Color(flight.c);
				})
			break;
		}
	}

	function setColormode(_colormode) {
		colormode = _colormode;
		updateColormode();
	}

	function oa2ao(obj) {
		var list = [];
		var keys = Object.keys(obj);
		var n = obj[keys[0]].length;
		for (var i = 0; i < n; i++) {
			var entry = {};
			keys.forEach(function (key) { entry[key] = obj[key][i] });
			list.push(entry)
		}
		return list;
	}
}