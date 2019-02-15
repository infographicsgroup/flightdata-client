"use strict"

FlightGlobal.Globe = function (opt) {
	var markers;

	var me = {
		clickableObjects:[],
		addAirportMarkers:addAirportMarkers,
		show:show,
		hide:hide,
	}

	me.object3D = new THREE.Group();

	var globeMesh = new THREE.Mesh(
		new THREE.SphereGeometry(1, 64, 32),
		new THREE.MeshPhongMaterial({
			map: new THREE.TextureLoader().load('assets/texture/globe_4k.png')
		})
	);

	me.object3D.add(globeMesh);
	me.object3D.rotation.x =  0.8;
	me.object3D.rotation.y = -Math.PI/2;

	me.control = new THREE.TrackballControls(me.object3D);
	me.control.dynamicDampingFactor = 0.99;

	return me;

	function show() {
		me.object3D.visible = true;
	}

	function hide() {
		me.object3D.visible = false;
	}

	function addAirportMarkers(airports) {
		markers = [];

		var markerGroup = new THREE.Group();
		me.object3D.add(markerGroup);

		me.clickableObjects = [];

		airports
		var material = new THREE.MeshPhongMaterial({
			color: 0xffff00,
			side: THREE.DoubleSide
		});
		airports.forEach(function (airport) {
			var geometry = new THREE.CircleGeometry(1/90, 32);

			var marker = new THREE.Mesh( geometry, material );

			airport.lonRad = -airport.lng * Math.PI / 180;
			airport.latRad =  airport.lat * Math.PI / 180;
			var r = 1.0001;

			airport.rotX = airport.latRad;
			airport.rotY = airport.lonRad-Math.PI/2;

			airport.x = r * Math.cos(airport.latRad) * Math.cos(airport.lonRad),
			airport.y = r * Math.sin(airport.latRad),
			airport.z = r * Math.cos(airport.latRad) * Math.sin(airport.lonRad)

			marker.position.set(airport.x, airport.y, airport.z);
			marker.lookAt(0,0,0);

			airport.marker = marker;
			markers.push(marker);
			markerGroup.add(marker);
		})
	}
}
