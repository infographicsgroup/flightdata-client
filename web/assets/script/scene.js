"use strict"

FlightGlobal.Scene = function (wrapper) {
	var airportGroup, airports, nextRenderCallback = [];

	var width = 1024, height = 1024;
	var oneTime = false;
	var scene = new THREE.Scene();
	//scene.background = new THREE.Color( 0x0c1a22 );
	scene.background = new THREE.TextureLoader().load('assets/texture/background.png');

	//var labelScene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
	camera.position.set(0,0,3);

	scene.add(new THREE.AmbientLight(0x333333));

	var light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(5,3,5);
	scene.add(light);

	var globe = new FlightGlobal.Globe();
	scene.add(globe.object3D);

	var dpr = window.devicePixelRatio || 1;
	dpr *= 0.80;

	var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false });
	renderer.setPixelRatio(dpr);

	var rtParameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: true };
	var renderTarget = new THREE.WebGLRenderTarget( width, height, rtParameters );
	var globeComposer = new THREE.EffectComposer( renderer, renderTarget );
	
	var renderPass = new THREE.RenderPass(scene, camera);
	renderPass.clearColor = new THREE.Color(0, 0, 0);
	renderPass.clearAlpha = 0;
	//renderPass.renderToScreen = true;

	var glowPass = new THREE.ShaderPass( THREE.SuperShader );
	glowPass.uniforms.glowAmount.value = 0.1;
	glowPass.uniforms.glowSize.value = 3;
	glowPass.uniforms.vigOffset.value = 0.9;
	glowPass.uniforms.saturation.value = 0.0;
	glowPass.uniforms.contrast.value = 0.0;
	glowPass.uniforms.brightness.value = 0;
	//glowPass.renderToScreen = true;


	var shiftPass = new THREE.ShaderPass( THREE.CustomTiltShiftShader );
	shiftPass.uniforms.focusPos.value = 0.51;
	shiftPass.uniforms.range.value = 0.43;
	shiftPass.uniforms.offset.value = 0.021;
	shiftPass.uniforms.strength.value = 1.0;
	shiftPass.renderToScreen = true;

	var fxaaPass = new THREE.ShaderPass( THREE.FXAAShader );
	fxaaPass.uniforms['resolution'].value.set(1 / width / dpr , 1 / height / dpr);
	fxaaPass.renderToScreen = true;

	var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(width,height), 1.5, .85, 0.61 );//1.0, 0.3, 0.5);
	//var bloom = new THREE.BloomPass(1.5, 1.0, 25, 4.0);
	
	var raysPass = new THREE.RaysPass(1.0, 0.0, 0.0, false );
	raysPass.renderToScreen = true;


	globeComposer.addPass( renderPass );
	globeComposer.addPass( glowPass );
	globeComposer.addPass( bloom );
	globeComposer.addPass( raysPass );
	//globeComposer.addPass( fxaaPass );



	var airportComposer = new THREE.EffectComposer( renderer, renderTarget );

	var renderAirportPass = new THREE.RenderPass(scene, camera);
	renderAirportPass.clearColor = new THREE.Color(0, 0, 0);
	renderAirportPass.clearAlpha = 0;
	

	var airportBloom = new THREE.UnrealBloomPass(new THREE.Vector2(width,height), 0.09, 0.5, 0.71 );//1.0, 0.3, 0.5);

	var airportRaysPass = new THREE.RaysPass(0.05, 1.0, 0.0, false );
	//airportRaysPass.renderToScreen = true;

	var airportGlowPass = new THREE.ShaderPass( THREE.SuperShader );
	airportGlowPass.uniforms.glowAmount.value = 0.05;
	airportGlowPass.uniforms.glowSize.value = 3;
	airportGlowPass.uniforms.vigOffset.value = 0.9;
	airportGlowPass.uniforms.saturation.value = 0.0;
	airportGlowPass.uniforms.contrast.value = 0.0;
	airportGlowPass.uniforms.brightness.value = 0;
	airportGlowPass.renderToScreen = true;

	airportComposer.addPass( renderAirportPass );
	airportComposer.addPass( airportRaysPass );
	airportComposer.addPass( airportGlowPass );

	wrapper.append(renderer.domElement);

	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();
	$(renderer.domElement).click(function (event) {
		event.preventDefault();

		mouse.x =  (event.offsetX / width )*2 - 1;
		mouse.y = -(event.offsetY / height)*2 + 1;

		raycaster.setFromCamera(mouse, camera);

		if (globe.clickableObjects) {
			var intersects = raycaster.intersectObjects(globe.clickableObjects);
			if (intersects.length > 0) intersects[0].object.onClick();
		}
	})

	stateController.on('airport', function (airport, oldAirport) {	
		var currentFov = {fov: 45};

		if (airport && !oldAirport) {
			animateGlobe2Airport();
		} else {
			animateAirport2Globe();
		}

		function animateGlobe2Airport() {
			if (airportGroup) {
				scene.remove(airportGroup.object3D);
				airportGroup = false;
			}
			FlightGlobal.helper.series([
				function (cb) {
					FlightGlobal.Airport(airport, function (group) {
						airportGroup = group;
						airportGroup.setVisibility(false);
						scene.add(airportGroup.object3D);
						cb();
					})
				},
				afterNextRender,
				function (cb) {
					TweenLite.to(currentFov, 0.5, {
						fov:10,
						onUpdate:updateFov,
						onComplete:cb,
						ease:Expo.easeOut
					});
				},
				function (cb) {
					globe.setVisibility(false);
					currentFov.fov = 10;
					updateFov();
					airportGroup.setVisibility(true);
					cb()
				},
				afterNextRender,
				function (cb) {
					TweenLite.to(currentFov, 0.5, {
						fov:45,
						onUpdate:updateFov,
						ease:Expo.easeOut
					});
				}
			]);
		}

		function animateAirport2Globe() {
			FlightGlobal.helper.series([
				function (cb) {
					TweenLite.to(currentFov, 0.5, {
						fov:10,
						onUpdate:updateFov,
						onComplete:cb,
						ease:Expo.easeOut
					});
				},
				function (cb) {
					airportGroup.setVisibility(false);
					currentFov.fov = 10;
					updateFov();
					globe.setVisibility(true);
					cb()
				},
				afterNextRender,
				function (cb) {
					oneTime = false;
					TweenLite.to(currentFov, 0.5, {
						fov:45,
						onUpdate:updateFov,
						ease:Expo.easeOut
					});
				}
			]);
		}

		function updateFov() {
			camera.fov = currentFov.fov;
		}
	})

	render();

	var me = {
		addAirportMarkers:addAirportMarkers,
		setColormode:function (colormode) {
			if (airportGroup) airportGroup.setColormode(colormode)
		},
		resize: resize,
	}

	return me;

	function addAirportMarkers(_airports) {
		airports = _airports;
		globe.addAirportMarkers(airports);

		globe.clickableObjects = [];

		airports.forEach(function (airport) {
			globe.clickableObjects.push(airport.marker);
			airport.marker.onClick = function () {
				stateController.showAirport(airport);
			}
		})
	}

	function render() {

		camera.updateProjectionMatrix();
		
		if (globe.control) globe.control.update();
		if (airportGroup && airportGroup.control) airportGroup.control.update();

		requestAnimationFrame(render);
		if (globe.object3D.visible) {

			globeComposer.render(1 / 60);
			//renderer.autoClear = false;
			//renderer.render( labelScene, camera );

		} else if ( !oneTime ) {

			globeComposer.render(1 / 60);
			//renderer.autoClear = false;
			//renderer.render( labelScene, camera );

			oneTime = true;
		}
		if (airportGroup && airportGroup.control && oneTime) {
			airportComposer.render(1 / 60);
		}

		if (nextRenderCallback.length > 0) {
			console.log('nextRenderCallback')
			nextRenderCallback.forEach(function (cb) { cb() });
			nextRenderCallback = [];
		}
	}

	function afterNextRender(cb) {
		console.log('afterNextRender')
		nextRenderCallback.push(cb);
	}

	function resize() {
		width  = wrapper.width();
		height = wrapper.height();

		camera.aspect = width/height;
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);

		if (globeComposer) globeComposer.setSize(width, height);
		if (airportComposer) airportComposer.setSize(width, height);

		if (fxaaPass) fxaaPass.uniforms['resolution'].value.set(1 / width / dpr, 1 / height / dpr);
	}
}
