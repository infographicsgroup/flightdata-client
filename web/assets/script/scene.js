function Scene(wrapper, cb) {
	var airports, markers;

	var width = 1024, height = 1024;
	var scene = new THREE.Scene();
	var clock = new THREE.Clock();

	var camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
	camera.position.z = 3;

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
	globe.rotation.y = -1.5;

	var renderer = new THREE.WebGLRenderer({antialias: true});

	wrapper.append(renderer.domElement);

	$(window).resize(resize);
	resize();

	var controls = new THREE.TrackballControls(globe);
	controls.dynamicDampingFactor = 0.99;

	render();

	cb({
		addAirports:addAirports,
	});

	function render() {
		var delta = clock.getDelta();
		controls.update(delta); 
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
				var geometry = new THREE.CircleGeometry(0.02, 32);

				var marker = new THREE.Mesh( geometry, material );

				var lonRad = -airport.lng * Math.PI / 180;
				var latRad =  airport.lat * Math.PI / 180;
				var r = 1.0001;

				marker.position.set(
					r * Math.cos(latRad) * Math.cos(lonRad),
					r * Math.sin(latRad),
					r * Math.cos(latRad) * Math.sin(lonRad)
				);
				marker.lookAt(0,0,0);

				marker.onClick = function () {
					showAirport(airport);
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
		
	}
}
