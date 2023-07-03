attribute vec4 a_position;
attribute vec2 texCoord;
attribute vec2 cutTexCoord;


uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec2 v_texCoord;
varying vec2 v_cutTexCoord;
varying vec4 v_color;

void main() {
  gl_Position = u_projection * u_view * u_world * a_position;
  v_texCoord = texCoord;
  v_cutTexCoord = cutTexCoord;
}