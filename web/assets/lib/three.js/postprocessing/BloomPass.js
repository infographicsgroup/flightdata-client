/**
 * @author alteredq / http://alteredqualia.com/
 */

THREE.BloomPass = function ( strength, luminanceThreshold, kernelSize, sigma, resolution ) {

	strength = ( strength !== undefined ) ? strength : 1;
	kernelSize = ( kernelSize !== undefined ) ? kernelSize : 25;
	sigma = ( sigma !== undefined ) ? sigma : 4.0;
	resolution = ( resolution !== undefined ) ? resolution : 256;
	luminanceThreshold = ( luminanceThreshold !== undefined) ? luminanceThreshold : .8;

	// render targets

	var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };

	this.renderTargetX = new THREE.WebGLRenderTarget( resolution, resolution, pars );
	this.renderTargetY = new THREE.WebGLRenderTarget( resolution, resolution, pars );

	// copy material

	if ( THREE.CopyShader === undefined )
		console.error( "THREE.BloomPass relies on THREE.CopyShader" );

	var thresholdShader = THREE.ThresholdShader;
	this.thresholdUniforms = THREE.UniformsUtils.clone( thresholdShader.uniforms );
	this.thresholdUniforms["threshold"].value = luminanceThreshold;
	this.threshold = new THREE.ShaderMaterial( {
		uniforms: this.thresholdUniforms,
		vertexShader: thresholdShader.vertexShader,
		fragmentShader: thresholdShader.fragmentShader,
		depthTest: false
	} );

	var copyShader = THREE.CopyShader;
	this.compositeUniforms = THREE.UniformsUtils.clone( copyShader.uniforms );
	this.compositeUniforms[ "opacity" ].value = strength;
	this.composite = new THREE.ShaderMaterial( {

		uniforms: this.compositeUniforms,
		vertexShader: copyShader.vertexShader,
		fragmentShader: copyShader.fragmentShader,
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthTest: false
	} );

	// convolution material

	if ( THREE.ConvolutionShader === undefined )
		console.error( "THREE.BloomPass relies on THREE.ConvolutionShader" );

	var convolutionShader = THREE.ConvolutionShader;

	this.convolutionUniforms = THREE.UniformsUtils.clone( convolutionShader.uniforms );

	this.convolutionUniforms[ "uImageIncrement" ].value = THREE.BloomPass.blurX;
	this.convolutionUniforms[ "cKernel" ].value = THREE.ConvolutionShader.buildKernel( sigma );

	this.materialConvolution = new THREE.ShaderMaterial( {

		uniforms: this.convolutionUniforms,
		vertexShader:  convolutionShader.vertexShader,
		fragmentShader: convolutionShader.fragmentShader,
		defines: {
			"KERNEL_SIZE_FLOAT": kernelSize.toFixed( 1 ),
			"KERNEL_SIZE_INT": kernelSize.toFixed( 0 )
		}

	} );

	this.enabled = true;
	this.needsSwap = false;
	this.clear = false;


	this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
	this.scene  = new THREE.Scene();

	this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
	this.scene.add( this.quad );

};

THREE.BloomPass.prototype = {
	setSize: function ( width, height ) {


	},

	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		var autoClear = renderer.autoClear;
		renderer.autoClear = false;

		if ( maskActive ) renderer.context.disable( renderer.context.STENCIL_TEST );

		this.quad.material = this.threshold;

		this.thresholdUniforms[ "tDiffuse" ].value = readBuffer;
		renderer.render( this.scene, this.camera, this.renderTargetY, false );

		// Render quad with blurred scene into texture (convolution pass 1)
		this.quad.material = this.materialConvolution;

		this.convolutionUniforms[ "tDiffuse" ].value = this.renderTargetY;
		this.convolutionUniforms[ "uImageIncrement" ].value = THREE.BloomPass.blurX;

		renderer.render( this.scene, this.camera, this.renderTargetX, false );


		// Render quad with blured scene into texture (convolution pass 2)

		this.convolutionUniforms[ "tDiffuse" ].value = this.renderTargetX;
		this.convolutionUniforms[ "uImageIncrement" ].value = THREE.BloomPass.blurY;

		renderer.render( this.scene, this.camera, this.renderTargetY, false );

		// Render original scene with superimposed blur to texture

		this.quad.material = this.composite;

		this.compositeUniforms[ "tDiffuse" ].value = this.renderTargetY;

		if ( maskActive ) renderer.context.enable( renderer.context.STENCIL_TEST );

		renderer.render( this.scene, this.camera, readBuffer, false );

		// restore original state
		renderer.autoClear = autoClear;
	}

};

THREE.BloomPass.blurX = new THREE.Vector2( 0.001953125, 0.0 );
THREE.BloomPass.blurY = new THREE.Vector2( 0.0, 0.001953125 );
