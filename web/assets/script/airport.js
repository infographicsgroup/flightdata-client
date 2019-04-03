"use strict"

FlightGlobal.Airport = function (airport, cbInit) {
	var curves, flightData;
	var colormode = stateController.get('colorMode');
	var vertexCount, geometry, colorAttribute, colors0, colors1;
	var clickableObjects = [];
	var destroyHandlers = [];

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
		initEvents:initEvents,
		enabled:true,
	}

	stateController.on('colorMode', colorModeHandler);
	destroyHandlers.push(function () {
		stateController.remove('colorMode', colorModeHandler);
	})
	function colorModeHandler(value) {
		colormode = value;
		updateColormode();
	}

	init();

	return me;

	function destroy() {
		destroyHandlers.forEach(function (handler) { handler() })
		clickableObjects = [];
	}

	function markAsChanged() {
		me.changed = true;
	}

	function addControl(camera) {
		me.control = new THREE.OrbitControls(camera);
		me.control.enableDamping = true;
		me.control.rotateSpeed = 0.18;
		me.control.minRadius = 0;
		me.control.enablePan = false;
		me.control.enableKeys = false;
		me.control.minPolarAngle = 0;
		me.control.maxPolarAngle = 1.4;
		me.control.minDistance = 1;
		me.control.maxDistance = 5;
		me.control.zoomSpeed = 0.3;

		destroyHandlers.push(function () { me.control.dispose() })
	}

	function initEvents(container, camera) {
		var raycaster = new THREE.Raycaster();
		var mouse = new THREE.Vector2();
		container = $(container);
		var domElement = container.get(0);
		var hoverObject = false;
		var mouseMoveCount, lastTouch;



		addEventListener('mousedown',  function () {
			mouseMoveCount = 0;
		});

		addEventListener('touchstart', function (event) {
			mouseMoveCount = 0;
			lastTouch = event.touches[0];
		});



		addEventListener('mousemove',  function (event) {
			mouseMoveCount++;
			var obj = intersectFinder(event.offsetX, event.offsetY);
			if (obj === null) return;
			hover(obj);
		});

		addEventListener('touchmove',  function (event) {
			mouseMoveCount++;
			lastTouch = event.touches[0];
		});



		addEventListener('mouseup',    function () {
			if (mouseMoveCount > 5) return;
			if (hoverObject) setTimeout(hoverObject.onClick, 0);
		});

		addEventListener('touchend',   function () {
			if (mouseMoveCount > 5) return;
			if (!lastTouch) return;
			var offset = container.offset();
			var obj = intersectFinder(
				lastTouch.clientX - offset.left,
				lastTouch.clientY - offset.top
			);
			if (obj) setTimeout(obj.onClick, 0);
		});

		function addEventListener(type, cb) {
			var options = {passive:false, capture:false};
			domElement.addEventListener(type, cb, options);
			destroyHandlers.push(function () {
				domElement.removeEventListener(type, cb, options);
			})
		}

		function hover(obj) {
			if (obj === hoverObject) return;
			if (hoverObject) hoverObject.onHover(false);
			if (obj) {
				obj.onHover(true);
				container.css('cursor', 'pointer');
			} else {
				container.css('cursor', 'default');
			}
			hoverObject = obj;
		}
		
		function intersectFinder(x,y) {
			if (!me.enabled) return null;
			if (!clickableObjects) return null;

			event.preventDefault();

			mouse.x =  (x / container.innerWidth() )*2 - 1;
			mouse.y = -(y / container.innerHeight())*2 + 1;

			raycaster.setFromCamera(mouse, camera);

			var intersects = raycaster.intersectObjects(clickableObjects);
			if (intersects.length > 0) return intersects[0].object;
			return false;
		}
	}

	function init() {
		var loaded = {
			texture: false,
			data: false,
		}

		me.object3D = new THREE.Group();
		
		destroyHandlers.push(function () { me.object3D.parent.remove(me.object3D); })

		me.object3D.visible = true;
		me.object3D.position.set(0,0.2,0);

		var planeSize = 2*4096/3840;
		var mapGeometry = new THREE.PlaneGeometry(planeSize, planeSize);
		var mapTexture = new THREE.TextureLoader().load('assets/map/'+airport.name+'.png', function () {
			loaded.texture = true;
			checkEverythingLoaded();
			markAsChanged();
		});
		mapTexture.anisotropy = 4;
		var mapMaterial = new THREE.MeshBasicMaterial({
			map: mapTexture,
			transparent: true,
		});
		mapMaterial.map.encoding = THREE.sRGBEncoding;
		var mapObject = new THREE.Mesh(mapGeometry, mapMaterial);
		mapObject.rotation.set(-Math.PI/2,0,0);
		mapObject.position.set(0,-0.2,0);
		me.object3D.add(mapObject);

		airport.next.forEach(function (next) {
			var canvas = document.createElement('canvas');
			canvas.width = 1024;
			canvas.height = 64;
			var scale = 0.06;

			var ctx = canvas.getContext('2d');

			//ctx.fillStyle = 'rgba(255,0,0,0.2)'
			//ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			var backwards = next[2] < 0;
	   
			ctx.font  = '60px "LL Gravur Cond Regular Web", sans-serif';
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = backwards ? 'right' : 'left';
			ctx.textBaseline = 'middle';

			var value = Math.pow(10, Math.floor(Math.log10(next[1]))-1);
			value = (Math.round(next[1]/value)*value).toFixed(0);
			if (value.length > 3) value = value.slice(0, -3) + ',' + value.slice(-3);
			var text = next[0].city.toUpperCase();

			if (backwards) {
				text = '◀\uFE0E '+value+' KM '+text;
			} else {
				text = text+' '+value+' KM ▶\uFE0E';
			}
			ctx.fillText(text, backwards ? canvas.width : 0, canvas.height/2);

			var labelTexture = new THREE.Texture(canvas);
			labelTexture.needsUpdate = true;
			labelTexture.anisotropy = 4;

			var labelMaterial = new THREE.MeshBasicMaterial({ map:labelTexture, transparent:true, opacity:0.5 });
			var labelGeometry = new THREE.PlaneGeometry(16*scale, scale);
			var labelObject = new THREE.Mesh(labelGeometry, labelMaterial);

			var a = (-next[2]+90)*Math.PI/180;
			var x = Math.cos(a);
			var y = Math.sin(a);
			labelObject.position.set(1.55*x, 1.55*y, 0.01);
			if (backwards) a += Math.PI;
			labelObject.rotateZ(a);
			mapObject.add(labelObject);

			clickableObjects.push(labelObject);
			labelObject.onClick = click;
			labelObject.onHover = hover;

			function click() {
				stateController.set({airport:next[0]});
			}

			function hover(hover) {
				labelMaterial.opacity  = hover ? 1.0 : 0.5;
				markAsChanged();
			}
		})

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
		var scale = visible ? 1 : 1e-10;
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