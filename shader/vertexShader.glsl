attribute vec4 position;
attribute vec2 texCoord;
uniform mat4 matrix;
// uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
    gl_Position = matrix*position;
    v_texCoord = texCoord;
}