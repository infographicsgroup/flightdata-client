varying vec2 uv1;
varying vec2 uv2;
varying vec2 uv3;
varying vec2 uv4;

uniform float ratio1;
uniform float ratio2;
uniform float ratio3;
uniform float ratio4;

vec2 getFlippedUV(float ratio)
{
    return (uv * 2.0 - 1.0) * ratio * .5 + .5;
}

void main()
{
    gl_Position = vec4(position, 1.0);
    uv1 = getFlippedUV(ratio1);
    uv2 = getFlippedUV(ratio2);
    uv3 = getFlippedUV(ratio3);
    uv4 = getFlippedUV(ratio4);
}
