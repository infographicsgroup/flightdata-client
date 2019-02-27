/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Film grain & scanlines shader
 *
 * - ported from HLSL to WebGL / GLSL
 * http://www.truevision3d.com/forums/showcase/staticnoise_colorblackwhite_scanline_shaders-t18698.0.html
 *
 * Screen Space Static Postprocessor
 *
 * Produces an analogue noise overlay similar to a film grain / TV static
 *
 * Original implementation and noise algorithm
 * Pat 'Hawthorne' Shearon
 *
 * Optimized scanlines + noise version with intensity scaling
 * Georg 'Leviathan' Steinrohder
 *
 * This version is provided under a Creative Commons Attribution 3.0 License
 * http://creativecommons.org/licenses/by/3.0/
 */

THREE.RaysShader = {

	uniforms: {

		"tDiffuse":   { value: null },
		"time":       { value: 0.0 },
		"nIntensity": { value: 0.5 },
		"sIntensity": { value: 0.05 },
		"sCount":     { value: 4096 },
		"grayscale":  { value: 1 }

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: [

		"#include <common>",
		
		// control parameter
		"uniform float time;",

		"uniform bool grayscale;",

		// noise effect intensity value (0 = no effect, 1 = full effect)
		"uniform float nIntensity;",

		// scanlines effect intensity value (0 = no effect, 1 = full effect)
		"uniform float sIntensity;",

		// scanlines effect count value (0 = no effect, 4096 = full effect)
		"uniform float sCount;",

		"uniform sampler2D tDiffuse;",

		"varying vec2 vUv;",

		"void main() {",

			// sample the source
			"vec4 cTextureScreen = texture2D( tDiffuse, vUv );",
		    
		    "vec2 custom_glFragCoord = vUv;",
		    //godrays
		    "vec2 position = custom_glFragCoord / 2.0;",
		    "vec2 temp_position = position;",
		    "vec3 accumulation = vec3(0.0);",
		    "int iterations = 64;",
		    "float contrast = 0.75;",
		    "vec2 movement = vec2(1.0);",

			"float fadefactor = 1.0/float(iterations);",
		    "float multiplier = 1.2;",
		    "for( int i=0; i<64; i++ ) {",
		       "vec3 texturesample = texture2D(tDiffuse,position+temp_position).xyz;",
		       "accumulation += multiplier*smoothstep(0.1,1.0,texturesample*texturesample);",
		       "multiplier *= 1.0-fadefactor;",
		       "temp_position += ((movement*0.25)-position)/float(iterations);",
		    "};",

		    "accumulation /= float(iterations);",
		    //contrast enhance to accentuate bright fragments
		    "vec3 color = texture2D(tDiffuse,custom_glFragCoord).rgb+(accumulation*(contrast/(1.0+dot(position,position))));",


			"gl_FragColor =  vec4( color, cTextureScreen.a );",

		"}"

	].join( "\n" )

};
