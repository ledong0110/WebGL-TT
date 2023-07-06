precision highp float;

uniform sampler2D u_image;
uniform sampler2D u_alpha;

varying vec2 v_texCoord;
varying vec2 v_cutTexCoord;

void main () {
  if (v_texCoord.x > 0. && v_texCoord.x < 1. && v_texCoord.y > 0. && v_texCoord.y < 1.){
      vec2 calTexCoord = v_texCoord*vec2(1,-1) + vec2(0,1);
      vec4 vTexture = texture2D(u_image, (calTexCoord)/2.+v_cutTexCoord);
    
      vec4 vAlpha = texture2D(u_alpha, v_texCoord);
      gl_FragColor =  vec4(vTexture.rgb, vAlpha.r);
      // gl_FragColor =  vec4(0,0,0,1);
  }
  else {
      
      discard;
  }
  // gl_FragColor = vec4(0,1,0,1);
}