uniform sampler2D tDiffuse;

varying vec2 vUv;

uniform vec2 sampleStep;

void main()
{
    vec3 col = decodeHDRE(texture2D(tDiffuse, vUv - sampleStep * .5));
    col += decodeHDRE(texture2D(tDiffuse, vUv + sampleStep * vec2(1.5, -.5)));
    col += decodeHDRE(texture2D(tDiffuse, vUv + sampleStep * vec2(-.5, 1.5)));
    col += decodeHDRE(texture2D(tDiffuse, vUv + sampleStep * 1.5));

    gl_FragColor = encodeHDRE(col * .25);
}
