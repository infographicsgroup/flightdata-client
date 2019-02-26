"use strict"

FlightGlobal.Scene = function (wrapper) {
	var airportGroup, airports;

	var width = 1024, height = 1024;
	var scene = new THREE.Scene();
	//scene.background = new THREE.Color( 0x0c1a22 );
	scene.background = new THREE.TextureLoader().load('assets/texture/background.png');

	var camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
	camera.position.set(0,0,3);

	scene.add(new THREE.AmbientLight(0x333333));

	var light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(5,3,5);
	scene.add(light);

	var globe = new FlightGlobal.Globe();
	scene.add(globe.object3D);

    var dpr = window.devicePixelRatio;
   	dpr *= .80;

	var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false });
	renderer.setPixelRatio(dpr ? dpr : 1);

	
	
	var rtParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: true };
	var renderTarget = new THREE.WebGLRenderTarget( width, height, rtParameters );
	var postProComposer = new THREE.EffectComposer( renderer, renderTarget );
    var renderPass = new THREE.RenderPass(scene, camera);
    renderPass.clearColor = new THREE.Color(0, 0, 0);
    renderPass.clearAlpha = 0;
    renderPass.renderToScreen = true;

    postProComposer.addPass( renderPass );


	wrapper.append(renderer.domElement);

	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();
	$(renderer.domElement).click(function (event) {
		event.preventDefault();

		mouse.x =  (event.clientX / width )*2 - 1;
		mouse.y = -(event.clientY / height)*2 + 1;

		raycaster.setFromCamera(mouse, camera);

		if (globe.clickableObjects) {
			var intersects = raycaster.intersectObjects(globe.clickableObjects); 
			if (intersects.length > 0) intersects[0].object.onClick();
		}
	})

	$(window).resize(resize);
	resize();

	render();

	var me = {
		addAirportMarkers:addAirportMarkers,
		closeAirport:closeAirport,
		setColormode:function (colormode) {
			if (airportGroup) airportGroup.setColormode(colormode)
		},
	}

	return me;

	function addAirportMarkers(cb) {
		$.getJSON('assets/data/airports.json', function (_airports) {
			airports = _airports;
			globe.addAirportMarkers(airports);

			airports.forEach(function (airport) {
				globe.clickableObjects.push(airport.marker);
				airport.marker.onClick = function () {
					showAirport(airport);
					globe.hide();
				}
			})
			cb();
		})
	}

	function render() {
		if (globe.control) globe.control.update();
		if (airportGroup && airportGroup.control) airportGroup.control.update();

		requestAnimationFrame(render);
		postProComposer.render(1 / 60);
		//renderer.render(scene, camera);
	}

	function showAirport(airport) {
		if (me.onAirport) me.onAirport(airport);

		if (airportGroup) airportGroup.destroy();

		airportGroup = new FlightGlobal.Airport(airport);
		scene.add(airportGroup.object3D);
	}

	function resize() {
		width = wrapper.width();
		height = wrapper.height();

		camera.aspect = width/height;
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);


    	if (postProComposer) postProComposer.setSize(width, height);

   		//if (fxaaPass) fxaaPass.uniforms['resolution'].value.set(1 / width, 1 / height);


	}

	function closeAirport() {
		if (me.onAirport) me.onAirport(false);
		
		airportGroup.destroy();
		airportGroup = false;
		globe.show();
	}

}
