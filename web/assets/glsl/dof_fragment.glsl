uniform sampler2D source;
uniform sampler2D blurred1;
uniform sampler2D blurred2;
uniform sampler2D depth;

uniform float strength;
uniform float focusDepth;
uniform float focusRange;
uniform float focusFalloff;

varying vec2 vUv;

void main()
{
    const float blendCutoff = .5;
    float depth = RGBA8ToFloat(texture2D(depth, vUv));
    float distance = abs(depth - focusDepth);

    float blurAmount = clamp((distance - focusRange) / focusFalloff, 0.0, 1.0);

    vec3 mainCol = decodeHDRE(texture2D(source, vUv));
    vec3 blurredCol1 = decodeHDRE(texture2D(blurred1, vUv));
    vec3 blurredCol2 = decodeHDRE(texture2D(blurred2, vUv));

    // for little blurs (0.0 - 0.25), use smaller amount, for (.5, 1.0), use larger blur
    float smallBlur = linearStep(0.0, blendCutoff, blurAmount);
    float largeBlur = linearStep(blendCutoff, 1.0, blurAmount);
    vec3 color = mix(blurredCol1, blurredCol2, largeBlur);
    color = mix(mainCol, color, smallBlur * strength);

    gl_FragColor = encodeHDRE(color);
}
