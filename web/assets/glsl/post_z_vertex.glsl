varying vec2 vUv;
varying vec3 viewVector;

uniform mat4 unprojectionMatrix;
uniform float nearClip;
uniform float farClip;


void main()
{
    gl_Position = vec4(position, 1.0);
    vUv = uv;
    vec4 unproj = unprojectionMatrix * vec4(position.xy, 0.0, 1.0);
    unproj /= unproj.w;
    viewVector = -unproj.xyz / unproj.z;
}
