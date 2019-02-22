uniform sampler2D tDiffuse;
uniform float threshold;

varying vec2 uv1;
varying vec2 uv2;
varying vec2 uv3;
varying vec2 uv4;

vec3 readWithThreshold(vec2 uv)
{
    vec4 hdre = texture2D(tDiffuse, uv);
    vec3 color = decodeHDRE(hdre);
    color = max(color - vec3(threshold), vec3(0.0));

    return color;
}

float boundMask(vec2 uv)
{
    return float(uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0);
}

void main()
{
    vec3 color1 = readWithThreshold(uv1) * boundMask(uv1);
    vec3 color2 = readWithThreshold(uv2) * boundMask(uv2);
    vec3 color3 = readWithThreshold(uv3) * boundMask(uv3);
    vec3 color4 = readWithThreshold(uv4) * boundMask(uv4);
	gl_FragColor = encodeHDRE(color1 + color2 + color3 + color4);
}
