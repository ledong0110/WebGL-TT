function randomColor() { return [Math.random(), Math.random(), Math.random()]}
const vs = `
attribute vec4 position;
attribute vec2 texCoord;
uniform mat4 matrix;
// uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
    gl_Position = matrix*position;
    v_texCoord = texCoord;
}
`;

  const fs = `
  precision mediump float;

// our texture
uniform sampler2D u_image;

varying vec2 v_texCoord;

void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
}
  `;

async function main() {
  await loadShadersAndRun("shader");
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, premultipliedAlpha:true});
  if (!gl) {
      return;
  }

  const carresponse = await fetch('obj/E34_Body.obj');  
  const cartext = await carresponse.text();

  const response = await fetch('obj/bowl_topview.obj');  
  const text = await response.text();

  const uvCam2Req = await fetch('obj/calib_cam2_topview.txt')
  let uvCam2Text = await uvCam2Req.text()
   uvCam2Text = uvCam2Text.split(/\n|\s/).map(parseFloat)


   const uvCam1Req = await fetch('obj/calib_cam1_topview.txt')
  let uvCam1Text = await uvCam1Req.text()
   uvCam1Text = uvCam1Text.split(/\n|\s/).map(parseFloat)


   const uvCam0Req = await fetch('obj/calib_cam0_topview.txt')
  let uvCam0Text = await uvCam0Req.text()
   uvCam0Text = uvCam0Text.split(/\n|\s/).map(parseFloat)

   const uvCam3Req = await fetch('obj/calib_cam3_topview.txt')
  let uvCam3Text = await uvCam3Req.text()
   uvCam3Text = uvCam3Text.split(/\n|\s/).map(parseFloat)
   
 
  let texCoord = [
        0.0, 1.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0,
    ];
  gl.clearColor(0, 1, 0, 1);
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

  uvMap = [uvCam0Text, uvCam1Text, uvCam2Text, uvCam3Text];  
  let obj = new GLParseVisitor().visit(parser(text))[0]
  let commonScale = 0.56
    // leftImg = new ImageLoading(gl, canvas, 'img/left.png', 'obj/alpha/alpha_TV_0.png');
    // leftImg.loadImage('left', uvCam0Text, commonScale, 0.1, obj.positions);
  frontImg = new ImageLoading(gl, canvas, 'img/front.png', 'obj/alpha/alpha_TV_1.png');
  frontImg.loadImage('front', uvCam1Text, commonScale, 0.1, obj.positions);

  rearImg = new ImageLoading(gl, canvas, 'img/rear.png', 'obj/alpha/alpha_TV_2.png');
  rearImg.loadImage('rear', uvCam2Text, commonScale, 0.1, obj.positions);

  // // // // // // // // leftImg.loadImage('rear', , texCoord, verCoord.left);

//   rightImg = new ImageLoading(gl, canvas, 'img/right.png');
//   rightImg.loadImage('', uvCam3Text, commonScale, 0.1, obj.positions);
//   carImg = new CarModelLoading(gl, canvas, 'img/front.png');
  
//   carImg.loadImage('center', uvCam2Text, 0.06, ImageLoading.globalScale, obj.positions);
  
//   rImg = new ImageStitchLoading(gl, canvas, ["img/left.png", "img/front.png", 'img/rear.png','img/right.png'], ["obj/alpha/alpha_TV_0.png", "obj/alpha/alpha_TV_1.png", "obj/alpha/alpha_TV_2.png", "obj/alpha/alpha_TV_3.png"]);
  
//   rImg.loadImage('center', uvMap, 0.07, ImageLoading.globalScale, obj.positions);
  
  let carobj = new GLParseVisitor().visit(parser(cartext))[0]
  carImg = new CarModelLoading(gl, canvas, vs, fs);
  
  carImg.loadImage('center', carobj.texCoord, 0.07, ImageLoading.globalScale, carobj.positions);
  carImg.load_car();
  // carLoad = new CarModelLoading(gl, canvas, text, vs, fs);
  // while (ImageLoading.count != 4)
  //   console.log(ImageLoading.count)
  // $(document).ready(() => {

  //   carLoad.loadModel('ll')
  // })
}
main()