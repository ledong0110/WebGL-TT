precision mediump float;

// our texture
uniform sampler2D u_image;
uniform sampler2D u_alpha;

varying vec2 v_texCoord;

void main() {
    
   
    
    if (v_texCoord.x > 0. && v_texCoord.x < 1. && v_texCoord.y > 0. && v_texCoord.y < 1.){

        vec4 vTexture = texture2D(u_image, v_texCoord);
        vec4 vAlpha = texture2D(u_alpha, v_texCoord);
        gl_FragColor =  vec4(vTexture.rgb, vAlpha.r);
    }
    else {
       
        discard;
    }

}