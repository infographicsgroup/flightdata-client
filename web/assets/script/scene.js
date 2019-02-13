function Scene(wrapper, cb) {
	var airports, markers, airportGroup, mapObject, flightObject, controlGlobe, controlAirport;

	var width = 1024, height = 1024;
	var scene = new THREE.Scene();
	var clock = new THREE.Clock();

	var camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
	camera.position.set(0,0,3);

	scene.add(new THREE.AmbientLight(0x333333));

	var light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(5,3,5);
	scene.add(light);
	
	var globe = new THREE.Group();
	scene.add(globe);

	var globeMesh = new THREE.Mesh(
		new THREE.SphereGeometry(1, 64, 32),
		new THREE.MeshPhongMaterial({
			map: new THREE.TextureLoader().load('assets/texture/globe.jpg'),
			bumpMap: new THREE.TextureLoader().load('assets/texture/globe_bump.jpg'),
			bumpScale: 0.005,
			specularMap: new THREE.TextureLoader().load('assets/texture/globe_spec.png'),
			specular: new THREE.Color('grey')
		})
	);

	globe.add(globeMesh);
	globe.rotation.x =  0.8;
	globe.rotation.y = -Math.PI/2;

	var renderer = new THREE.WebGLRenderer({antialias: true});

	wrapper.append(renderer.domElement);

	$(window).resize(resize);
	resize();

	controlGlobe = new THREE.TrackballControls(globe);
	controlGlobe.dynamicDampingFactor = 0.99;

	render();

	cb({
		addAirports:addAirports,
	});

	function render() {
		var delta = clock.getDelta();

		if (controlGlobe) controlGlobe.update(delta);
		if (controlAirport) controlAirport.update(delta);

		requestAnimationFrame(render);
		renderer.render(scene, camera);
	}

	function resize() {
		width = wrapper.width();
		height = wrapper.height();

		camera.aspect = width/height;
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);
	}

	function addAirports() {
		markers = [];

		var airportGroup = new THREE.Group();
		globe.add(airportGroup);

		$.getJSON('assets/data/airports.json', function (_airports) {
			var material = new THREE.MeshPhongMaterial({
				color: 0xffff00,
				side: THREE.DoubleSide
			});
			airports = _airports;
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

				marker.onClick = function () {
					showAirport(airport);
					hideGlobe();
				}

				airport.marker = marker;
				markers.push(marker);
				airportGroup.add(marker);
			})
		})

		var raycaster = new THREE.Raycaster();
		var mouse = new THREE.Vector2();

		$(document).click(function (event) {
			event.preventDefault();

			mouse.x =   (event.clientX / width )*2 - 1;
			mouse.y = - (event.clientY / height)*2 + 1;

			raycaster.setFromCamera(mouse, camera);

			var intersects = raycaster.intersectObjects(markers); 

			if (intersects.length > 0) intersects[0].object.onClick();
		})
	}

	function showAirport(airport) {
		/*
		var easeInOut = function(p) {
			return -0.5 * (Math.cos(Math.PI * p) - 1);
		}
		TweenLite.to(globe.rotation, 2, {x:airport.rotX, y:airport.rotY, ease:easeInOut})
		TweenLite.to(globe.position, 2, {z:1.99, ease:easeInOut})
		*/

		if (!airportGroup) {
			airportGroup = new THREE.Group();
			scene.add(airportGroup);

			var geometry = new THREE.CircleGeometry(1, 64);
			var material = new THREE.MeshBasicMaterial({
				map: new THREE.TextureLoader().load('assets/map/adelaide.jpg'),
				side: THREE.DoubleSide
			});
			mapObject = new THREE.Mesh( geometry, material );
			airportGroup.add(mapObject);

			controlAirport = new THREE.TrackballControls(airportGroup);
			controlAirport.dynamicDampingFactor = 0.99;
		}
		airportGroup.visible = true;
	}

	function hideAirport() {
		airportGroup.visible = false;
	}

	function showGlobe() {
		globe.visible = true;
	}

	function hideGlobe() {
		globe.visible = false;
	}
}
