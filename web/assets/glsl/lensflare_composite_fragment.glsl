uniform sampler2D source;
uniform sampler2D flare;
uniform sampler2D lensDirt;
uniform float strength;

varying vec2 vUv;

void main()
{
// some kind of glare texture could be used to make the flare more interesting
    vec4 hdre = texture2D(source, vUv);
    vec3 color1 = decodeHDRE(hdre);
    vec3 lensDirt = texture2D(lensDirt, vUv).xyz;

    vec2 dir = .5 - vUv;
    vec4 hdreR = texture2D(flare, vUv);
    vec4 hdreG = texture2D(flare, vUv + dir * .03);
    vec4 hdreB = texture2D(flare, vUv + dir * .06);
    float r = (decodeHDRE(hdreR)).r;
    float g = (decodeHDRE(hdreG)).g;
    float b = (decodeHDRE(hdreB)).b;
    vec3 color2 = vec3(r, g, b) * lensDirt;
    // adding in gamma space, no one will know...
	gl_FragColor = encodeHDRE(color1 + color2 * strength);
}
