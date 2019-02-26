/**
 * @author alteredq / http://alteredqualia.com/
 *
 * Full-screen textured quad shader
 */

THREE.ThresholdShader = {

	uniforms: {

		"tDiffuse": { type: "t", value: null },
		"threshold":  { type: "f", value: 1.0 }

	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join("\n"),

	fragmentShader: [

		"uniform float threshold;",

		"uniform sampler2D tDiffuse;",

		"varying vec2 vUv;",

		"void main() {",
			"vec4 texel = texture2D( tDiffuse, vUv );",
			"float lum = dot(texel.xyz, vec3(.299, .587, .114));",
			"if (lum < threshold) texel *= 0.0;",
			"gl_FragColor = texel;",

		"}"

	].join("\n")

};
