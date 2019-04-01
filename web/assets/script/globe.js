"use strict"

FlightGlobal.Globe = function () {
	var clickableObjects;

	var me = {
		addAirportMarkers:addAirportMarkers,
		setVisibility:setVisibility,
		initEvents:initEvents,
		addControl:addControl,
		changed:true,
		enabled:true,
	}

	me.object3D = new THREE.Group();

	var material = new THREE.SpriteMaterial({
		map: new THREE.TextureLoader().load('assets/texture/earth-glow.png', markAsChanged),
		transparent: true,
		depthWrite:false,
		opacity:0.6
	});
	var atmosphericalSprite = new THREE.Sprite(material);
	atmosphericalSprite.scale.set(3.6,3.6);

	me.object3D.add(atmosphericalSprite);

	var globeMesh = new THREE.Mesh(
		new THREE.SphereGeometry(1, 64, 32),
		new THREE.MeshPhongMaterial({
			map: new THREE.TextureLoader().load('assets/texture/globeDiffuse_4k.png', markAsChanged),
			//opacity: 0.1,
			//transparent: true,
			//depthWrite: false,
		})
	);

	me.object3D.add(globeMesh);

	addRoutes()

	return me;

	function initEvents(container, camera) {
		var raycaster = new THREE.Raycaster();
		var mouse = new THREE.Vector2();
		container = $(container);
		var hoverObject = false;

		container.click(intersectFinder(function (obj) {
			if (obj) obj.onClick();
		}))
		container.mousemove(intersectFinder(function (obj) {
			if (obj === hoverObject) return;
			if (hoverObject) hoverObject.onHover(false);
			if (obj) {
				obj.onHover(true);
				container.css('cursor', 'pointer');
			} else {
				container.css('cursor', 'default');
			}
			hoverObject = obj;
		}))

		function intersectFinder(cb) {
			return function (event) {
				if (!me.enabled) return;
				if (!clickableObjects) return;

				event.preventDefault();

				mouse.x =  (event.offsetX / container.innerWidth() )*2 - 1;
				mouse.y = -(event.offsetY / container.innerHeight())*2 + 1;

				raycaster.setFromCamera(mouse, camera);

				var intersects = raycaster.intersectObjects(clickableObjects);
				if (intersects.length > 0) {
					cb(intersects[0].object);
				} else {
					cb(false);
				}
			}
		}
	}

	function markAsChanged() {
		me.changed = true;
	}

	function addControl(camera) {
		me.control = new THREE.OrbitControls(camera);
		me.control.enableDamping = true;
		me.control.rotateSpeed = 0.18;
		me.control.minRadius = 1;
		me.control.enablePan = false;
		me.control.enableKeys = false;
		me.control.minPolarAngle = 0+0.4;
		me.control.maxPolarAngle = Math.PI-0.6;
		me.control.minDistance = 1.5;
		me.control.maxDistance = 5;
		me.control.zoomSpeed = 0.3;
	}

	function setVisibility(visible) {
		me.object3D.visible = visible;
		me.object3D.enabled = visible;
		if (me.control) me.control.enabled = visible;
		me.enabled = visible;
		markAsChanged();
	}

	function addRoutes() {
		var curves = new THREE.Group();
		curves.rotation.set(0,0,0);
		curves.position.set(0,0,0);
		me.object3D.add(curves);

		var buffer;
		var segments;

		$.getJSON('assets/data/globe/globe.json', function (data) {
			segments = data;
			checkRouteData();
		})

		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'assets/data/globe/globe.bin', true);
		xhr.responseType = 'arraybuffer';
		xhr.onload = function(e) {
			buffer = new Int16Array(this.response);
			checkRouteData();
		};
		xhr.send();

		function checkRouteData() {
			if (!segments) return;
			if (!buffer) return;

			FlightGlobal.helper.diffDecoding(buffer, 3);

			var opacity = 0.5;
			var materials = [
				getMaterial('hsl(220, 80%, 20%)', 0.1*opacity),
				getMaterial('hsl(290, 80%, 25%)', 0.2*opacity),
				getMaterial('hsl(  0, 80%, 30%)', 0.3*opacity),
				getMaterial('hsl( 20, 80%, 35%)', 0.4*opacity),
				getMaterial('hsl( 40, 80%, 40%)', 0.5*opacity),
			];

			segments = segments.map(function(segment) {
				var path = [];
				var i0 = segment[0];
				var i1 = segment[1];
				for (var i = i0; i < i1; i += 3) {
					path.push([
						buffer[i+0]/4000,
						buffer[i+1]/4000,
						buffer[i+2]/4000,
					])
				}
				return path;
			})

			var groups = [];
			segments.forEach(function (path) {
				var p0 = path[0];
				var p1 = path[path.length-1];
				var distance = Math.sqrt(
					Math.pow(p0[0]-p1[0],2) +
					Math.pow(p0[1]-p1[1],2) + 
					Math.pow(p0[2]-p1[2],2)
				);
				distance = Math.max(0, Math.min(0.999, Math.pow(distance/1.7, 0.8)));
				var index = Math.floor(distance*materials.length);
				if (!groups[index]) groups[index] = {paths:[], material:materials[index]};
				groups[index].paths.push(path);
			})

			groups.forEach(function (group) {
				var geometry = new THREE.BufferGeometry();

				var indices = [];
				var positions = [];
				var offset = 0;
				group.paths.forEach(function (path) {
					for (var j = 0; j < path.length; j++) {
						positions.push(path[j][0]);
						positions.push(path[j][1]);
						positions.push(path[j][2]);
					}
					for (var j = offset; j < offset+path.length-1; j++) {
						indices.push(j,j+1);
					}
					offset += path.length;
				})
				geometry.setIndex(indices);
				geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
				geometry.computeBoundingSphere();
				var mesh = new THREE.LineSegments(geometry, group.material);
				curves.add(mesh);
			})

			markAsChanged();

			function getMaterial(color, opacity) {
				return new THREE.LineBasicMaterial({
					color: color,
					transparent: true,
					premultipliedAlpha: false,
					opacity: opacity,
					depthWrite: false,
				});
			}
		}
	}

	function addAirportMarkers(airports) {
		var markerGroup = new THREE.Group();
		me.object3D.add(markerGroup);

		clickableObjects = [];

		var rayTexture = new THREE.TextureLoader().load('assets/texture/freehandLinesStrong.png', markAsChanged);

		var cursorMaterial = new THREE.MeshBasicMaterial({
			color:0xff0000,
			transparent:true, 
			side:THREE.FrontSide,
			opacity:0,
			depthWrite:false
		});

		airports.forEach(function (airport) {
			var rayMaterial = new THREE.MeshBasicMaterial({
				map:rayTexture,
				transparent:true, 
				side:THREE.DoubleSide,
				depthWrite:false,
				opacity:0.5,
			});

			//console.log(airport);
			var rayHeight = airport.passengersPerYear*5e-9;
			var rayGeometry = new THREE.PlaneBufferGeometry(0.025, rayHeight*2, 8);

			var rayMesh1 = new THREE.Mesh(rayGeometry, rayMaterial);
			rayMesh1.rotation.x = Math.PI / 2;

			var rayMesh2 = new THREE.Mesh(rayGeometry, rayMaterial);
			rayMesh2.rotation.x = Math.PI / 2;
			rayMesh2.rotation.y = Math.PI / 2;

			var cursorGeometry    = new THREE.BoxBufferGeometry(0.05, rayHeight, 0.05);
			var cursorMesh        = new THREE.Mesh(cursorGeometry, cursorMaterial);
			cursorMesh.position.z = -rayHeight/2;
			cursorMesh.rotation.x = Math.PI / 2;

			var markerMaterial = new THREE.MeshBasicMaterial({
				color: 0xf3f3f3,
				side: THREE.DoubleSide,
				transparent:true,
				opacity:0.1,
			});

			var markerGeometry = new THREE.CircleGeometry(1/50, 16);
			var marker = new THREE.Mesh(markerGeometry, markerMaterial);
			marker.add(rayMesh1);
			marker.add(rayMesh2);
			marker.add(cursorMesh);

			var marker1 = new THREE.Object3D();

			var canvas = document.createElement('canvas');
			var size = canvas.width = canvas.height = 128;

			var ctx = canvas.getContext('2d');

			ctx.clearRect(0,0,size,size);
	   
			ctx.font  = '60px "LL Gravur Cond Regular Web"';
			ctx.fillStyle = 'rgba(255,255,255,1)';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'middle';
			ctx.fillText(airport.iata, 0, size/2);

			var labelTexture = new THREE.Texture(canvas);
			labelTexture.needsUpdate = true;
			
			var labelMaterial = new THREE.SpriteMaterial({ map:labelTexture, transparent:true, opacity:0.2 });

			var sprite = new THREE.Sprite(labelMaterial);

			sprite.scale.set(0.08, 0.08);

			airport.lonRad = -airport.lng * Math.PI / 180;
			airport.latRad =  airport.lat * Math.PI / 180;
			var r = 1.002;

			airport.rotX = airport.latRad;
			airport.rotY = airport.lonRad-Math.PI/2;

			airport.x = r * Math.cos(airport.latRad) * Math.cos(airport.lonRad),
			airport.y = r * Math.sin(airport.latRad),
			airport.z = r * Math.cos(airport.latRad) * Math.sin(airport.lonRad)

			marker.position.set(airport.x, airport.y, airport.z);
			marker.lookAt(0,0,0);

			r = 1+rayHeight;
			marker1.position.x = r * Math.cos(airport.latRad) * Math.cos(airport.lonRad);
			marker1.position.y = r * Math.sin(airport.latRad);
			marker1.position.z = r * Math.cos(airport.latRad) * Math.sin(airport.lonRad);
			marker1.lookAt(0,0,0);
			marker1.add(sprite)
			sprite.position.x -= 0.05;
			markerGroup.add(marker1);

			markerGroup.add(marker);

			clickableObjects.push(cursorMesh);
			clickableObjects.push(sprite);
			cursorMesh.onClick = click;
			sprite.onClick = click;
			cursorMesh.onHover = hover;
			sprite.onHover = hover;

			function click() {
				stateController.set({airport:airport});
			}

			function hover(hover) {
				rayMaterial.opacity    = hover ? 1.0 : 0.5;
				labelMaterial.opacity  = hover ? 1.0 : 0.2;
				markerMaterial.opacity = hover ? 0.3 : 0.1;
				markAsChanged();
			}
		})

		markAsChanged();
	}
}
