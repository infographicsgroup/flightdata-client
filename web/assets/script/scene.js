"use strict"

FlightGlobal.Scene = function (wrapper) {
	var airportGroup, airports;

	var width = 1024, height = 1024;
	var oneTime = false;
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

	var bloom = new THREE.UnrealBloomPass(new THREE.Vector2(width,height), 1.5, .85, 0.65 );//1.0, 0.3, 0.5);
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
	

	var airportBloom = new THREE.UnrealBloomPass(new THREE.Vector2(width,height), 0.15, 0.5, 0.5 );//1.0, 0.3, 0.5);

	var airportRaysPass = new THREE.RaysPass(0.05, 1.0, 0.0, false );
	airportRaysPass.renderToScreen = true;

	var airportGlowPass = new THREE.ShaderPass( THREE.SuperShader );
	airportGlowPass.uniforms.glowAmount.value = 0.3;
	airportGlowPass.uniforms.glowSize.value = 3;
	airportGlowPass.uniforms.vigOffset.value = 0.9;
	airportGlowPass.uniforms.saturation.value = 0.0;
	airportGlowPass.uniforms.contrast.value = 0.0;
	airportGlowPass.uniforms.brightness.value = 0;

	airportComposer.addPass( renderAirportPass );
	airportComposer.addPass( fxaaPass );

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

	stateController.onChange('airport', function (airport) {
		if (airportGroup) {
			scene.remove(airportGroup.object3D);
			airportGroup = false;
		}

		if (!airport) return;

		airportGroup = new FlightGlobal.Airport(airport);
		scene.add(airportGroup.object3D);
	})

	render();

	var me = {
		addAirportMarkers:addAirportMarkers,
		setColormode:function (colormode) {
			if (airportGroup) airportGroup.setColormode(colormode)
		},
		updateFov:function(value, airport) {
			camera.fov = value.fov; 
		},
		onCompleteFov:function(airport) {
			stateController.showAirport(airport);

			var currentFov = { fov: 10};
        	TweenLite.to( currentFov, 0.5, { delay:0.2, fov:45, onUpdate:me.updateFov, onUpdateParams:[ currentFov ], ease:Expo.easeOut } );   
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
				var currentFov = { fov: 45};
        		TweenLite.to( currentFov, 0.5, { fov:10, onUpdate:me.updateFov, onUpdateParams:[ currentFov ], onComplete:me.onCompleteFov, onCompleteParams:[airport], ease: Back.easeOut } );   
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
		} else if ( !oneTime ) {
			globeComposer.render(1 / 60);
			oneTime = true;
		}
		if (airportGroup && airportGroup.control && oneTime) {
			airportComposer.render(1 / 60);
		}
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
