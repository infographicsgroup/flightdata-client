"use strict"

FlightGlobal.Airport = function (airport, cbInit) {
	var curves, curveGroups, flightData;
	var colormode = stateController.get('colorMode');

	var me = {
		setVisibility:setVisibility,
		addControl:addControl,
	}

	stateController.on('colorMode', function (value) {
		// memory leak in stateController!!!
		colormode = value;
		updateColormode();
	})

	init();

	return me;

	function addControl(camera) {
		me.control = new THREE.OrbitControls(camera);
		me.control.enableDamping = true;
		me.control.dampingFactor = 0.1;
		me.control.rotateSpeed = 0.05;
		me.control.enablePan = false;
		me.control.enableKeys = false;
		me.control.minPolarAngle = 0;
		me.control.maxPolarAngle = 1.4;
		me.control.minDistance = 1;
		me.control.maxDistance = 8;
		me.control.zoomSpeed = 0.3;
	}

	function init() {
		var momentum = 0.005;

		var loaded = {
			texture: false,
			data: false,
		}

		me.object3D = new THREE.Group();

		//me.object3D.rotation.set(0.6,-me.control.calcMomentumResult(momentum),0);
		me.object3D.visible = true;
		me.object3D.position.set(0,0.2,0);

		var planeSize = 2*4096/3840;
		var geometry = new THREE.PlaneGeometry(planeSize, planeSize);
		var mapMaterial = new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader().load('assets/map/'+airport.name+'.png', function () {
				loaded.texture = true;
				checkEverythingLoaded();
			}),
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

			curveGroups = [];
			var curveGroupsLookup = {};

			flightData.forEach(function (flight) {
				var groupName = flight.c+'_'+flight.takeOff;
				var group;
				if (!curveGroupsLookup[groupName]) {
					group = {
						c:flight.c,
						takeOff:flight.takeOff,
						positions:[],
						indices:[],
						material: new THREE.LineBasicMaterial({
							color: '#000000',
							transparent: true,
							opacity: 0.2,
							depthWrite: false,
						})
					}
					curveGroupsLookup[groupName] = group;
					curveGroups.push(group);
				} else {
					group = curveGroupsLookup[groupName];
				}

				var i0 = flight.pos0;
				var i1 = flight.pos1;
				for (var i = i0; i < i1; i += 3) {
					var index = group.positions.push(
						buffer[i+0]/4000*2.1,
						buffer[i+1]/4000*2.1,
						buffer[i+2]/4000*1
					)/3;
					if (i > i0) group.indices.push(index-2, index-1);
				}
			})

			curveGroups.forEach(function (group) {
				var geometry = new THREE.BufferGeometry();
				geometry.setIndex(group.indices);
				geometry.addAttribute('position', new THREE.Float32BufferAttribute(group.positions, 3));
				geometry.computeBoundingSphere();
				var mesh = new THREE.LineSegments(geometry, group.material);
				curves.add(mesh);
			})

			updateColormode();

			loaded.data = true;
			checkEverythingLoaded();
		}

		function checkEverythingLoaded() {
			if (!loaded.texture) return;
			if (!loaded.data) return;
			cbInit(me);
		}
	}

	function setVisibility(visible) {
		//me.object3D.visible = visible;
		var scale = visible ? 1 : 0.01;
		me.object3D.scale.set(scale,scale,scale);
		if (me.control) me.control.enabled = visible;
		me.enabled = visible;
	}

	function updateColormode() {
		if (!curveGroups) return;
		switch (colormode) {
			case 0: 
				curveGroups.forEach(function (group) {
					group.material.color = new THREE.Color(group.c);
				})
			break;
			case 1: 
				curveGroups.forEach(function (group) {
					group.material.color = new THREE.Color(group.takeOff ? '#33ddff' : '#ffff33');
				})
			break;
		}
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