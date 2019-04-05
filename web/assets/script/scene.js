"use strict"

FlightGlobal.Scene = function (wrapper) {
	var airportGroup, airports, nextRenderCallback = [];

	var width = 1024, height = 1024;
	var scene = new THREE.Scene();
	var autoRotate = false;
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
	scene.add(camera);

	var globe = new FlightGlobal.Globe();
	globe.addControl(camera);
	scene.add(globe.object3D);

	var renderer = new THREE.WebGLRenderer({antialias: true, alpha: false });

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
	glowPass.uniforms.rgbShiftAmount.value = 0;

	var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(width,height), 1.5, .85, 0.61 );//1.0, 0.3, 0.5);

	var raysPass = new THREE.RaysPass(1.0, 0.0, 0.0, false);
	raysPass.renderToScreen = true;

	globeComposer.addPass( renderPass );
	globeComposer.addPass( glowPass );
	globeComposer.addPass( bloom );
	globeComposer.addPass( raysPass );


	wrapper.append(renderer.domElement);

	globe.initEvents(renderer.domElement, camera);

	stateController.on('airport', function (airport, oldAirport) {	
		if (airport === oldAirport) return;

		var currentCam;

		globe.control.enabled = false;
		if (airportGroup) airportGroup.control.enabled = false;

		if (airport && !oldAirport) {
			animateGlobe2Airport();
		} else if (!airport && oldAirport) {
			animateAirport2Globe();
		} else if (airport && oldAirport) {
			animateAirport2Airport();
		} else throw Error();

		function animateGlobe2Airport() {
			if (airportGroup) {
				airportGroup.destroy();
				airportGroup = false;
			}
			getCurrentCam();
			FlightGlobal.helper.series([
				function (cb) {
					stateController.set({globeLegend:false});
					FlightGlobal.Airport(airport, function (group) {
						airportGroup = group;
						airportGroup.initEvents(renderer.domElement, camera);
						airportGroup.addControl(camera);
						airportGroup.setVisibility(false);
						scene.add(airportGroup.object3D);
						cb();
					})
				},
				afterNextRender,
				function (cb) {
					animate(500, 'in', {fov:10, x:airport.x, y:airport.y, z:airport.z}, cb)
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
					animate(500, 'out', {fov:45, x:0, y:1, z:1}, cb);
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
					animate(500, 'in', {fov:150, x:0, y:1, z:0}, cb);
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
					animate(500, 'out', {fov:45}, cb);
				},
				function () {
					//stateController.set({globeLegend:true});
					airportGroup.destroy();
					airportGroup = false;
					globe.control.enabled = true;
				},
			]);
		}

		function animateAirport2Airport() {
			globe.setVisibility(false);
			var newAirportGroup;

			getCurrentCam();
			var startPos = {x:currentCam.x, y:currentCam.y, z:currentCam.z};
			var next = oldAirport.next.filter(function (n) { return n[0] === airport })[0];
			if (!next) return;
			var distance = 0.5*next[1]*360/40074;
			distance = Math.max(3, Math.min(20, distance));
			var a = (-next[2]+90)*Math.PI/180;
			var x =  distance*Math.cos(a);
			var z = -distance*Math.sin(a);

			FlightGlobal.helper.series([
				function (cb) {
					stateController.set({airportLegend:false});
					FlightGlobal.Airport(airport, function (_group) {
						newAirportGroup = _group;
						newAirportGroup.setVisibility(false);
						newAirportGroup.initEvents(renderer.domElement, camera);
						scene.add(newAirportGroup.object3D);
						cb();
					})
				},
				afterNextRender,
				function (cb) {
					animate(500, 'in', {x:startPos.x+x, z:startPos.z+z}, cb, true);
				},
				function (cb) {
					airportGroup.setVisibility(false);
					airportGroup.destroy();

					currentCam.x = startPos.x-x;
					currentCam.z = startPos.z-z;

					updateCam(true);

					airportGroup = newAirportGroup;
					airportGroup.setVisibility(true);

					cb()
				},
				afterNextRender,
				function (cb) {
					animate(500, 'out', startPos, cb, true);
				},
				function () {
					stateController.set({airportLegend:true});
					airportGroup.addControl(camera);
					//airportGroup.control.enabled = true;
				},
			]);
		}

		function animate(duration, direction, endValues, onComplete, fix) {
			var startTime = Date.now();
			var endTime = startTime+duration;
			var keys = [];
			var PI = 3.141592653589793238462643383;

			function easeIn(v)    { return  1-Math.cos(v*PI/2) }
			function easeOut(v)   { return    Math.sin(v*PI/2) }
			function easeInOut(v) { return (1-Math.cos(v*PI))/2 }

			var ease = (direction === 'in') ? easeIn : easeOut;
			keys.push({name:'fov', ease:ease});
			if (!fix) ease = easeInOut;
			keys.push({name:'x', ease:ease});
			keys.push({name:'y', ease:ease});
			keys.push({name:'z', ease:ease});

			var startValues = {};
			keys = keys.filter(function (key) {
				startValues[key.name] = currentCam[key.name];
				return isFinite(endValues[key.name])
			})

			step();
			function step() {
				var time = Date.now();
				var v = (time-startTime)/duration;
				if (v < 0) v = 0;
				if (v > 1) v = 1;

				keys.forEach(function (key) {
					currentCam[key.name] = key.ease(v)*(endValues[key.name] - startValues[key.name]) + startValues[key.name]
				})
				updateCam(fix);

				if (time < endTime) {
					requestAnimationFrame(step)
				} else {
					if (onComplete) onComplete();
				}
			}
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

		function updateCam(fix) {
			camera.fov = currentCam.fov;

			var spherical = new THREE.Spherical(currentCam.radius, currentCam.phi, currentCam.theta);
			camera.position.set(currentCam.x, currentCam.y, currentCam.z);
			if (!fix) {
				camera.position.setLength(currentCam.length);
				camera.lookAt(0,0,0);
			}

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
		setAutoRotate: setAutoRotate,
	}

	return me;

	function setAutoRotate(value) {
		autoRotate = value;
	}

	function addAirportMarkers(_airports) {
		airports = _airports;
		globe.addAirportMarkers(airports);
	}

	function render() {

		if (nextRenderCallback.length > 0) sceneChanged = true;

		camera.updateProjectionMatrix();
		
		if (airportGroup) {
			sceneChanged = sceneChanged || airportGroup.changed;
			if (airportGroup.control) {
				if (autoRotate) airportGroup.control.rotateLeft(3e-5);
				sceneChanged = airportGroup.control.update() || sceneChanged;
			}
		} else {
			if (autoRotate) globe.control.rotateLeft(3e-5);
			sceneChanged = globe.control.update() || sceneChanged || globe.changed;
		}

		requestAnimationFrame(render);

		if (sceneChanged) {
			if (airportGroup && airportGroup.enabled) {
				bloom.enabled = false;
				globeComposer.render(1 / 60);
				airportGroup.changed = false;
			} else {
				if (FlightGlobal.helper.touchEvents) globe.hoverFocus();
				bloom.enabled = true;
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
		var dpr = window.devicePixelRatio || 1;

		width  = wrapper.width();
		height = wrapper.height();

		camera.aspect = width/height;
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);
		renderer.setPixelRatio(dpr);

		if (globeComposer) globeComposer.setSize(width*dpr, height*dpr);

		sceneChanged = true;
	}
}
