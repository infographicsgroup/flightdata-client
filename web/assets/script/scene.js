function Scene(wrapper, cb) {
	var width = 1024, height = 1024;
	var scene = new THREE.Scene();
	var clock = new THREE.Clock();


	var camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
	camera.position.z = 1.5;

	scene.add(new THREE.AmbientLight(0x333333));

	var light = new THREE.DirectionalLight(0xffffff, 1);
	light.position.set(5,3,5);
	scene.add(light);
	
	var globe = new THREE.Mesh(
		new THREE.SphereGeometry(0.5, 32, 32),
		new THREE.MeshPhongMaterial({
			map: new THREE.TextureLoader().load('assets/texture/globe.jpg'),
			bumpMap: new THREE.TextureLoader().load('assets/texture/globe_bump.jpg'),
			bumpScale: 0.005,
			specularMap: new THREE.TextureLoader().load('assets/texture/globe_spec.png'),
			specular: new THREE.Color('grey')
		})
	);
	scene.add(globe);





	var renderer = new THREE.WebGLRenderer();
	wrapper.append(renderer.domElement);
	resize();

	//console.log(globe);
	//globe.rotation.x = 3;
	var controls = new THREE.TrackballControls(globe);
	//controls.rotateSpeed = 1.0;
	//controls.zoomSpeed = 1.0;
	//controls.panSpeed = 1.0;
	//        controls.noZoom=false;
	controls.dynamicDampingFactor = 0.99;
	controls.noPan = true;
	//controls.staticMoving = true;


	render();

	function render() {
		var delta = clock.getDelta();
		controls.update(delta);
		//globe.updateMatrix();
		//console.log(globe.up);
		//globe.rotation.y += 0.0005;
		//clouds.rotation.y += 0.0005;  
		requestAnimationFrame(render);
		renderer.render(scene, camera);
	}


	$(window).resize(resize);

	function resize() {
		width = wrapper.width();
		height = wrapper.height();

		camera.aspect = width/height;
		camera.updateProjectionMatrix();

		renderer.setSize(width, height);
	}
}