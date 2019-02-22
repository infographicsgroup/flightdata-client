uniform sampler2D tDiffuse;
uniform float exposure;

varying vec2 vUv;

void main()
{
    vec4 hdre = texture2D(tDiffuse, vUv);
    vec3 color = decodeHDRE(hdre);

//    color *= color * exposure;
//    color = max(vec3(0.0), color.xyz - 0.004);

	// this has pow 2.2 gamma included, not valid if using fast gamma correction

    // Jim Hejl and Richard Burgess-Dawson
	float a = 6.2;
    float b = .5;
    float c = 6.2;
    float d = 1.7;
    float e = 0.06;

	// ACES
	/*float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;*/

//	gl_FragColor = vec4(saturate((color*(a*color+b))/(color*(c*color+d)+e)), 1.0);
	gl_FragColor = vec4(color, 1.0);
}
