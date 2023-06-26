precision mediump float;

attribute vec4 position;
attribute vec2 texCoord;
uniform mat4 matrix;


varying vec2 v_texCoord;


void main() {
    gl_Position = matrix*position;
    v_texCoord = texCoord;
}