"use strict"

FlightGlobal.Scene = function (wrapper) {
	var airportGroup, airports, nextRenderCallback = [];

	var width = 1024, height = 1024;
	var scene = new THREE.Scene();
	var sceneChanged = false;
	//scene.background = new THREE.Color( 0x0c1a22 );
	scene.background = new THREE.TextureLoader().load('assets/texture/background.png');

	//var labelScene = new THREE.Scene();

	var camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
	camera.position.set(0,0,3);
	camera.position.applyAxisAngle(new THREE.Vector3(1,0,0),-0.8);
	camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),1.6);
	camera.lookAt(0,0,0);

	scene.add(new THREE.AmbientLight(0x333333));

	var light = new THREE.DirectionalLight(0xffffff, 0.65);
	light.position.set(5,3,5);
	//scene.add(light);
	camera.add(light);
	scene.add( camera );

	var globe = new FlightGlobal.Globe();
	globe.addControl(camera);
	scene.add(globe.object3D);

	var dpr = window.devicePixelRatio || 1;
	//dpr *= 0.80;

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
		var currentCam;

		globe.control.enabled = false;
		if (airportGroup) airportGroup.control.enabled = false;

		if (airport && !oldAirport) {
			animateGlobe2Airport();
		} else if (!airport && oldAirport) {
			animateAirport2Globe();
		} else throw Error();

		function animateGlobe2Airport() {
			if (airportGroup) {
				scene.remove(airportGroup.object3D);
				airportGroup = false;
			}
			getCurrentCam();
			FlightGlobal.helper.series([
				function (cb) {
					stateController.set({globeLegend:false});
					FlightGlobal.Airport(airport, function (group) {
						airportGroup = group;
						airportGroup.addControl(camera);
						airportGroup.setVisibility(false);
						scene.add(airportGroup.object3D);
						cb();
					})
				},
				afterNextRender,
				function (cb) {
					TweenLite.to(currentCam, 0.5, {
						fov:10,
						x:airport.x,
						y:airport.y,
						z:airport.z,
						onUpdate:updateCam,
						onComplete:cb,
						ease:Expo.easeIn
					});
				},
				function (cb) {
					globe.setVisibility(false);
					currentCam.fov = 150;
					currentCam.x = 0;
					currentCam.y = 1;
					currentCam.z = 0;
					currentCam.length = 3;
					updateCam();
					airportGroup.setVisibility(true);
					cb()
				},
				afterNextRender,
				function (cb) {
					TweenLite.to(currentCam, 0.5, {
						fov:45,
						x: 1,
						y: 1,
						z: 0,
						onUpdate:updateCam,
						onComplete:cb,
						ease:Expo.easeOut
					});
				},
				function () {
					stateController.set({airportLegend:true});
					if (airportGroup) airportGroup.control.enabled = true;
				},
			]);
		}

		function animateAirport2Globe() {
			getCurrentCam();
			FlightGlobal.helper.series([
				function (cb) {
					stateController.set({airportLegend:false});
					TweenLite.to(currentCam, 0.5, {
						fov:150,
						x: 0,
						y: 1,
						z: 0,
						onUpdate:updateCam,
						onComplete:cb,
						ease:Expo.easeIn
					});
				},
				function (cb) {
					airportGroup.setVisibility(false);
					currentCam.fov = 10;
					currentCam.x = oldAirport.x;
					currentCam.y = oldAirport.y;
					currentCam.z = oldAirport.z;
					currentCam.length = 3;
					updateCam();
					globe.setVisibility(true);
					cb()
				},
				afterNextRender,
				function (cb) {
					TweenLite.to(currentCam, 0.5, {
						fov:45,
						onUpdate:updateCam,
						onComplete:cb,
						ease:Expo.easeOut
					});
				},
				function () {
					stateController.set({globeLegend:true});
					airportGroup.destroy();
					airportGroup = false;
					globe.control.enabled = true;
				},
			]);
		}


		function getCurrentCam() {
			currentCam = {
				fov: camera.fov,
				x: camera.position.x,
				y: camera.position.y,
				z: camera.position.z,
				length: camera.position.length(),
			}
		}

		function updateCam() {
			camera.fov = currentCam.fov;

			var spherical = new THREE.Spherical(currentCam.radius, currentCam.phi, currentCam.theta);
			camera.position.set(currentCam.x, currentCam.y, currentCam.z);
			camera.position.setLength(currentCam.length);
			camera.lookAt(0,0,0);

			sceneChanged = true;
		}
	})

	render();

	var me = {
		addAirportMarkers:addAirportMarkers,
		setColormode:function (colormode) {
			if (airportGroup) airportGroup.setColormode(colormode);
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
				stateController.set({airport:airport});
			}
		})
	}

	function render() {

		camera.updateProjectionMatrix();
		
		if (airportGroup) {
			sceneChanged = airportGroup.control.update() || sceneChanged || airportGroup.changed;
		} else {
			sceneChanged = globe.control.update() || sceneChanged || globe.changed;
		}

		requestAnimationFrame(render);

		if (sceneChanged) {
			if (airportGroup) {
				airportComposer.render(1 / 60);
				airportGroup.changed = false;
			} else {
				globeComposer.render(1 / 60);
				globe.changed = false;
			}
			sceneChanged = false;
		}

		if (nextRenderCallback.length > 0) {
			nextRenderCallback.forEach(function (cb) { cb() });
			nextRenderCallback = [];
		}
	}

	function afterNextRender(cb) {
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

		sceneChanged = true;
	}
}
