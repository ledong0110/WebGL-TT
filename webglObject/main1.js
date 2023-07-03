function randomColor() { return [Math.random(), Math.random(), Math.random()]}
const vs = `
precision mediump float;

    const vec3 lightDirection = normalize(vec3(3, 3.0, 7.0));
    const float ambient = 0.1;

    attribute vec3 position;
    attribute vec3 color;
    attribute vec3 normal;

    varying vec3 vColor;
    varying float vBrightness;

    uniform mat4 matrix;
    uniform mat4 normalMatrix;

    void main() {        
        vec3 worldNormal = (normalMatrix * vec4(normal, 1)).xyz;
        float diffuse = max(0.0, dot(worldNormal, lightDirection));

        vColor = color;
        vBrightness = ambient + diffuse;

        gl_Position = matrix * vec4(position, 1);
    }
`;

  const fs = `
  precision mediump float;

    varying vec3 vColor;
    varying float vBrightness;

    uniform sampler2D textureID;

    void main() {
        vec4 texel = vec4(vColor, 1);
        // texel.xyz *= vBrightness;
        gl_FragColor = vec4(vColor, 1);
    }
  `;

async function main() {
  await loadShadersAndRun("shader");
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, premultipliedAlpha:true});
  if (!gl) {
      return;
  }
  const response = await fetch('obj/E34_Body.obj');  
  const text = await response.text();

  
 
  let texCoord = [
        0.0, 1.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0,
    ];
  gl.clearColor(0, 1, 0, 1);
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

  let commonScale = 0.55
  frontImg = new ImageLoading(gl, canvas, 'img/front.png');
  frontImg.loadImage('front', texCoord, commonScale);

  rearImg = new ImageLoading(gl, canvas, 'img/rear.png');
  rearImg.loadImage('rear', texCoord, commonScale);

  leftImg = new ImageLoading(gl, canvas, 'img/left.png');
  leftImg.loadImage('left', texCoord, commonScale);
  // // // // // // // // leftImg.loadImage('rear', , texCoord, verCoord.left);

  rightImg = new ImageLoading(gl, canvas, 'img/right.png');
  rightImg.loadImage('right', texCoord, commonScale);
  let obj = new GLParseVisitor().visit(parser(text))[0]
  carImg = new CarModelLoading(gl, canvas, 'obj/E34_Tex_Luxury_Blue.bmp');
  
  carImg.loadImage('center', obj.texCoord, 0.10, ImageLoading.globalScale, obj.positions);

  const canvas1 = document.querySelector("#canvas1");
  const gl1 = canvas1.getContext("webgl", { preserveDrawingBuffer: true, premultipliedAlpha:true});
  if (!gl1) {
      return;
  }
  gl1.clearColor(1, 0.4, 0.7, 1);
  gl1.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

  frontImg = new ImageLoading(gl1, canvas1, 'img/front.png');
  frontImg.loadImage('front', texCoord, commonScale);

  rearImg = new ImageLoading(gl1, canvas1, 'img/rear.png');
  rearImg.loadImage('rear', texCoord, commonScale);

  leftImg = new ImageLoading(gl1, canvas1, 'img/left.png');
  leftImg.loadImage('left', texCoord, commonScale);
  // // // // // // // // leftImg.loadImage('rear', , texCoord, verCoord.left);

  rightImg = new ImageLoading(gl1, canvas1, 'img/right.png');
  rightImg.loadImage('right', texCoord, commonScale);
  
  // carImg = new CarModelLoading(gl1, canvas1, 'obj/E34_Tex_Luxury_Blue.bmp');
  
  // carImg.loadImage('center', obj.texCoord, 0.20, ImageLoading.globalScale, obj.positions);

  // carLoad = new CarModelLoading(gl, canvas, text, vs, fs);
  // while (ImageLoading.count != 4)
  //   console.log(ImageLoading.count)
  // $(document).ready(() => {

  //   carLoad.loadModel('ll')
  // })
}
main()