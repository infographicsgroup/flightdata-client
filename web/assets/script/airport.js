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

		var geometry = new THREE.CircleGeometry(1, 64);
		var mapMaterial = new THREE.MeshBasicMaterial({
			transparent: true,
			opacity: 0.5,
		});
		var mapObject = new THREE.Mesh(geometry, mapMaterial);
		mapObject.rotation.set(-Math.PI/2,0,0);
		mapObject.position.set(0,-0.2,0);
		me.object3D.add(mapObject);

		mapMaterial.map = new THREE.TextureLoader().load('assets/map/'+airport.name+'.jpg')

		curves = new THREE.Group();
		curves.rotation.set(-Math.PI/2,0,0);
		curves.position.set(0,-0.2,0);
		me.object3D.add(curves);

		var buffer;
		flightData = false;

		$.getJSON('assets/data/airports/'+airport.name+'.json', function (data) {
			flightData = data;
			checkFlightData();
		})

		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'assets/data/airports/'+airport.name+'.bin', true);
		xhr.responseType = 'arraybuffer';
		xhr.onload = function(e) {
			buffer = new Uint16Array(this.response); 
			checkFlightData();
		};
		xhr.send();

		function checkFlightData() {
			if (!flightData) return;
			if (!buffer) return;

			for (var i = 0; i < buffer.length; i+=4) {
				var idx = buffer[i+0];

				if (!flightData[idx].segments) flightData[idx].segments = [];

				flightData[idx].segments.push(new THREE.Vector3(
					(buffer[i+1]/32768-1)*1.05,
					(buffer[i+2]/32768-1)*1.05,
					(buffer[i+3]/32768-1)*4
				));
			}

			flightData.forEach(function (flight) {
				var curve = new THREE.CatmullRomCurve3(flight.segments);
				var points = curve.getPoints(flight.segments.length*3);
				var cmlgeometry = new THREE.BufferGeometry().setFromPoints(points);

				var material = new THREE.LineBasicMaterial({
					color: '#000000',
					transparent: true,
					premultipliedAlpha: false,
					opacity: 0.3,
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
					flight.material.color = new THREE.Color(flight.takeOff ? '#ff0000' : '#0064b5');
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
}