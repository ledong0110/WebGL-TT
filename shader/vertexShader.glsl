precision mediump float;

attribute vec4 position;
attribute vec2 texCoord;
attribute vec2 cutTexCoord;
uniform mat4 matrix;


varying vec2 v_texCoord;
varying vec2 v_cutTexCoord;


void main() {
    gl_Position = matrix*position;
    v_texCoord = texCoord;
    v_cutTexCoord = cutTexCoord;
}