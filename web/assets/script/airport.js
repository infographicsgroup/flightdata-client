"use strict"

FlightGlobal.Airport = function (airport, cbInit) {
	var curves, flightData;
	var colormode = stateController.get('colorMode');
	var vertexCount, geometry, colorAttribute, colors0, colors1;

	var material = new THREE.LineBasicMaterial({
		vertexColors: THREE.VertexColors,
		transparent: true,
		opacity: 0.1,
		depthWrite: false,
		blending:THREE.AdditiveBlending,
	})

	var me = {
		setVisibility:setVisibility,
		addControl:addControl,
		destroy:destroy,
		changed:true,
	}

	stateController.on('colorMode', colorModeHandler);
	function colorModeHandler(value) {
		colormode = value;
		updateColormode();
	}

	init();

	return me;

	function destroy() {
		me.object3D.parent.remove(me.object3D);
		stateController.remove('colorMode', colorModeHandler);
	}

	function markAsChanged() {
		me.changed = true;
	}

	function addControl(camera) {
		me.control = new THREE.OrbitControls(camera);
		me.control.enableDamping = true;
		me.control.dampingFactor = 0.1;
		me.control.rotateSpeed = 0.18;
		me.control.minRadius = 0;
		me.control.enablePan = false;
		me.control.enableKeys = false;
		me.control.minPolarAngle = 0;
		me.control.maxPolarAngle = 1.4;
		me.control.minDistance = 1;
		me.control.maxDistance = 5;
		me.control.zoomSpeed = 0.3;
	}

	function init() {
		var momentum = 0.005;

		var loaded = {
			texture: false,
			data: false,
		}

		me.object3D = new THREE.Group();

		me.object3D.visible = true;
		me.object3D.position.set(0,0.2,0);

		var planeSize = 2*4096/3840;
		var mapGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
		var mapMaterial = new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader().load('assets/map/'+airport.name+'.png', function () {
				loaded.texture = true;
				checkEverythingLoaded();
				markAsChanged();
			}),
			transparent: true,
		});
		mapMaterial.map.encoding = THREE.sRGBEncoding;
		var mapObject = new THREE.Mesh(mapGeometry, mapMaterial);
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
			markAsChanged();
		})

		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'assets/data/airports/'+airport.name+'.bin', true);
		xhr.responseType = 'arraybuffer';
		xhr.onload = function(e) {
			buffer = new Int16Array(this.response); 
			checkFlightData();
			markAsChanged();
		};
		xhr.send();

		function checkFlightData() {
			if (!flightData) return;
			if (!buffer) return;

			FlightGlobal.helper.diffDecoding(buffer, 3);

			vertexCount = buffer.length/3;
			var m = vertexCount-flightData.length;
			var positions = new Float32Array(vertexCount*3);
			colors0 = new Float32Array(vertexCount*3);
			colors1 = new Float32Array(vertexCount*3);
			var indices = new Uint32Array(m*2);

			for (var i = 0; i < vertexCount*3; i += 3) {
				positions[i+0] = buffer[i+0]/4000*2.1;
				positions[i+1] = buffer[i+1]/4000*2.1;
				positions[i+2] = buffer[i+2]/4000*1;
			}

			var j = 0, k = 0;
			flightData.forEach(function (flight) {
				var i0 = flight.pos0;
				var i1 = flight.pos1;
				
				var color0 = new THREE.Color(flight.c);
				color0 = [color0.r, color0.g, color0.b];
				
				var color1 = new THREE.Color(flight.takeOff ? '#33ddff' : '#ffff33');
				color1 = [color1.r, color1.g, color1.b];
				
				for (var i = i0; i < i1; i += 3) {
					colors0[i+0] = color0[0];
					colors0[i+1] = color0[1];
					colors0[i+2] = color0[2];

					colors1[i+0] = color1[0];
					colors1[i+1] = color1[1];
					colors1[i+2] = color1[2];

					var index = i/3;
					if (i === i0) continue;
					indices[j++] = index-1;
					indices[j++] = index;
				}
			})

			geometry = new THREE.BufferGeometry();
			geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
			geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
			geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors0.slice(0), 3));

			geometry.computeBoundingSphere();
			var mesh = new THREE.LineSegments(geometry, material);
			curves.add(mesh);

			updateColormode();

			loaded.data = true;
			checkEverythingLoaded();
			markAsChanged();
		}

		function checkEverythingLoaded() {
			if (!loaded.texture) return;
			if (!loaded.data) return;
			cbInit(me);
			markAsChanged();
		}
	}

	function setVisibility(visible) {
		var scale = visible ? 1 : 0.01;
		me.object3D.scale.set(scale,scale,scale);
		if (me.control) me.control.enabled = visible;
		me.enabled = visible;
		markAsChanged();
	}

	function updateColormode() {
		if (!geometry) return;
		var colors = geometry.attributes.color.array;
		switch (colormode) {
			case 0:
				for (var i = 0; i < vertexCount*3; i++) colors[i] = colors0[i];
			break;
			case 1:
				for (var i = 0; i < vertexCount*3; i++) colors[i] = colors1[i];
			break;
		}
		geometry.colorsNeedUpdate = true;
		geometry.attributes.color.needsUpdate = true;
		markAsChanged();
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