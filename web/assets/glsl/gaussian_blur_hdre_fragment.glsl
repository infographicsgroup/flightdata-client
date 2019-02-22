uniform sampler2D tDiffuse;

varying vec2 vUv;

uniform vec2 sampleStep;
uniform float weights[NUM_WEIGHTS];

void main()
{
    vec3 col = decodeHDRE(texture2D(tDiffuse, vUv)) * weights[0];

    for (int i = 1; i <= KERNEL_RADIUS; ++i) {
        vec2 offset = float(i) * sampleStep;
        col += (decodeHDRE(texture2D(tDiffuse, vUv + offset)) + decodeHDRE(texture2D(tDiffuse, vUv - offset))) * weights[i];
    }

    gl_FragColor = encodeHDRE(col);
}
