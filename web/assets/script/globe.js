"use strict"

FlightGlobal.Globe = function (opt) {
	var markers;

	var me = {
		clickableObjects:[],
		addAirportMarkers:addAirportMarkers,
		setVisibility:setVisibility,
	}

	me.object3D = new THREE.Group();

	var material = new THREE.SpriteMaterial({
		map: new THREE.TextureLoader().load('assets/texture/earth-glow.png'),
		transparent: true,
		depthWrite:false
	});
	var atmosphericalSprite = new THREE.Sprite( material );
	atmosphericalSprite.scale.set(3.6,3.6);

	me.object3D.add( atmosphericalSprite );

	var globeMesh = new THREE.Mesh(
		new THREE.SphereGeometry(1, 64, 32),
		new THREE.MeshPhongMaterial({
			map: new THREE.TextureLoader().load('assets/texture/globeDiffuse_4k.png')
		})
	);




	var planeSize = 2*4096/3840;
	var geometry = new THREE.PlaneGeometry(planeSize, planeSize);
	var mapMaterial = new THREE.MeshBasicMaterial({
		map: new THREE.TextureLoader().load('assets/map/adelaide.png'),
		transparent: true,
	});
	mapMaterial.map.encoding = THREE.sRGBEncoding;
	var mapObject = new THREE.Mesh(geometry, mapMaterial);
	mapObject.rotation.set(-Math.PI/2,0,0);
	mapObject.position.set(0,-0.2,0);
	mapObject.scale.set(0.1,0.1,0.1);
	me.object3D.add(mapObject);

	me.object3D.add(globeMesh);
	me.object3D.rotation.x =  0.8;
	me.object3D.rotation.y = -Math.PI/2;

	addRoutes()

	me.control = new THREE.TrackballControls(me.object3D);
	me.control.dynamicDampingFactor = 0.99;

	return me;

	function setVisibility(visible) {
		me.object3D.visible = visible;
		me.object3D.enabled = visible;
		me.control.enabled = visible;
		me.enabled = visible;
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

			var materials = [
				getMaterial('hsl(220, 80%, 20%)', 0.1),
				getMaterial('hsl(290, 80%, 25%)', 0.2),
				getMaterial('hsl(  0, 80%, 30%)', 0.3),
				getMaterial('hsl( 20, 80%, 35%)', 0.4),
				getMaterial('hsl( 40, 80%, 40%)', 0.5),
			];

			segments = segments.map(function(segment) {
				var path = [];
				var i0 = segment[0];
				var i1 = segment[1];
				for (var i = i0; i < i1; i += 3) {
					path.push(new THREE.Vector3(
						buffer[i+0]/4000,
						buffer[i+1]/4000,
						buffer[i+2]/4000,
					))
				}
				return path;
			})

			segments.forEach(function (path) {
				var cmlgeometry = new THREE.BufferGeometry().setFromPoints(path);
				var p0 = path[0];
				var p1 = path[path.length-1];
				var distance = Math.sqrt(Math.pow(p0.x-p1.x,2) + Math.pow(p0.y-p1.y,2) + Math.pow(p0.z-p1.z,2));
				distance = Math.max(0, Math.min(0.999, Math.pow(distance/1.7, 0.8)));
				var index = Math.floor(distance*materials.length);
				material = materials[index];
				var curveObject = new THREE.Line(cmlgeometry, material);
				curves.add(curveObject);
			})

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
		markers = [];

		var markerGroup = new THREE.Group();
		me.object3D.add(markerGroup);

		me.clickableObjects = [];

		var material = new THREE.MeshBasicMaterial({
			color: 0xffff00,
			side: THREE.DoubleSide,
			transparent:true,
			opacity:0
		});

		var planeMaterial = new THREE.MeshBasicMaterial({
			map: new THREE.TextureLoader().load('assets/texture/freehandLines.png'), 
			transparent:true, 
			side:THREE.DoubleSide 
		});

		airports.forEach(function (airport) {
			
			var geometry = new THREE.CircleGeometry(1/40, 32);

			var planeGeometry = new THREE.PlaneGeometry( 0.025, 0.5 + Math.random() * 0.5 );
			var planeMesh = new THREE.Mesh( planeGeometry, planeMaterial );
			planeMesh.rotation.x = Math.PI / 2;

			var marker = new THREE.Mesh( geometry, material );
			marker.add( planeMesh );

			var marker1 = new THREE.Object3D();

			var canvas    = document.createElement("canvas");
			var width     = 256;
			var height    = 256;
	        canvas.width  = width;
	        canvas.height = height;

	        var ctx = canvas.getContext( "2d", {alpha: false} );

	        ctx.clearRect(0,0,256,256);           
	   
	        ctx.font  = "50px Arial";
	        ctx.fillStyle = "rgba(203,187,160,1)";
	        ctx.textAlign = "center";
	        ctx.textBaseline = 'middle'; 
	        ctx.fillText( airport.iata, width / 2, ( height / 2 ) );  

	        var labelTexture = new THREE.Texture(canvas);
	        labelTexture.needsUpdate = true;
	        
	        var labelMat = new THREE.SpriteMaterial( { map:labelTexture, transparent:true, opacity:0.7 } );

			var sprite = new THREE.Sprite( labelMat );

            sprite.scale.set( 0.15, 0.15 );

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

			r = 1.350;
			marker1.position.x = r * Math.cos(airport.latRad) * Math.cos(airport.lonRad);
			marker1.position.y = r * Math.sin(airport.latRad);
			marker1.position.z = r * Math.cos(airport.latRad) * Math.sin(airport.lonRad);
			marker1.lookAt(0,0,0);
			marker1.add( sprite )
			sprite.position.x -= 0.04;
			markerGroup.add( marker1 );

			airport.marker = marker;
			markers.push(marker);
			markerGroup.add(marker);
   
		})
	}
}
