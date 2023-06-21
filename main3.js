
const canvas1 = document.getElementById('canvas1');
const canvas2 = document.getElementById('canvas2');
gl1 = canvas1.getContext('experimental-webgl');
gl2 = canvas2.getContext('experimental-webgl');
if (!gl1 || !gl2) {
    throw new Error("WebGL is not supported")
}
function deg2Rad(d) {
  return d * Math.PI / 180;
}
// Set list vertices vertexData = [...]

// Create buffer

// Load vertice list to buffer


// Create vertex shader


//create fragment shader


// Create program


// Attack shaders to program


// Enable vertex attribute
const vertices = [
  // Front
  0.5, 0.5, 0.5,
  0.5, -.5, 0.5,
  -.5, 0.5, 0.5,
  -.5, 0.5, 0.5,
  0.5, -.5, 0.5,
  -.5, -.5, 0.5,

  // Left
  -.5, 0.5, 0.5,
  -.5, -.5, 0.5,
  -.5, 0.5, -.5,
  -.5, 0.5, -.5,
  -.5, -.5, 0.5,
  -.5, -.5, -.5,

  // Back
  -.5, 0.5, -.5,
  -.5, -.5, -.5,
  0.5, 0.5, -.5,
  0.5, 0.5, -.5,
  -.5, -.5, -.5,
  0.5, -.5, -.5,

  // Right
  0.5, 0.5, -.5,
  0.5, -.5, -.5,
  0.5, 0.5, 0.5,
  0.5, 0.5, 0.5,
  0.5, -.5, 0.5,
  0.5, -.5, -.5,

  // Top
  0.5, 0.5, 0.5,
  0.5, 0.5, -.5,
  -.5, 0.5, 0.5,
  -.5, 0.5, 0.5,
  0.5, 0.5, -.5,
  -.5, 0.5, -.5,

  // Bottom
  0.5, -.5, 0.5,
  0.5, -.5, -.5,
  -.5, -.5, 0.5,
  -.5, -.5, 0.5,
  0.5, -.5, -.5,
  -.5, -.5, -.5,
];

function randomColor() { return [Math.random(), Math.random(), Math.random()]}

let colorData = [];
for (let face = 0; face < 6; face++) {
  let faceColor = randomColor();
  for (let vertex = 0; vertex < 6; vertex++) {
      colorData.push(...faceColor)
  }
}
// draw
function initBuffer(gl, vertices, colorData) {
  

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); 


  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW); 
  return {
    positionBuffer: positionBuffer,
    colorBuffer: colorBuffer,
 
  };
}

function initShaderProgram(gl) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, `
  precision mediump float;

  attribute vec3 position;
  attribute vec3 color;
  varying vec3 vColor;

  uniform mat4 matrix;
 

  void main() {
      vColor = color;
      gl_Position = matrix*vec4(position, 1.0);
      // gl_PointSize = 10.0;
  }
  `);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, `
  precision mediump float;

  varying vec3 vColor;

  void main() {
      
      gl_FragColor = vec4(vColor,1);
  }
  `);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram()
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  return program
}

var buffer1 = initBuffer(gl1, vertices, colorData)

var program1 = initShaderProgram(gl1)
const positionLocation = gl1.getAttribLocation(program1, `position`)
gl1.enableVertexAttribArray(positionLocation);
gl1.bindBuffer(gl1.ARRAY_BUFFER, buffer1.positionBuffer)
gl1.vertexAttribPointer(positionLocation, 3, gl1.FLOAT, false, 0 ,0);

const colorLocation = gl1.getAttribLocation(program1, `color`)
gl1.enableVertexAttribArray(colorLocation);
gl1.bindBuffer(gl1.ARRAY_BUFFER, buffer1.colorBuffer)
gl1.vertexAttribPointer(colorLocation, 3, gl1.FLOAT, false, 0 ,0);

gl1.useProgram(program1);
gl1.enable(gl1.DEPTH_TEST);

var buffer2 = initBuffer(gl2, vertices, colorData)

var program2 = initShaderProgram(gl2)
const positionLocation2 = gl2.getAttribLocation(program2, `position`)
gl2.enableVertexAttribArray(positionLocation2);
gl2.bindBuffer(gl2.ARRAY_BUFFER, buffer2.positionBuffer)
gl2.vertexAttribPointer(positionLocation2, 3, gl2.FLOAT, false, 0 ,0);

const colorLocation2 = gl2.getAttribLocation(program2, `color`)
gl2.enableVertexAttribArray(colorLocation2);
gl2.bindBuffer(gl2.ARRAY_BUFFER, buffer2.colorBuffer)
gl2.vertexAttribPointer(colorLocation2, 3, gl2.FLOAT, false, 0 ,0);

gl2.useProgram(program2);
gl2.enable(gl2.DEPTH_TEST);

function computeMatrix(canvas, scaling, translation, rotation, fieldOfViews, cameraPos) {
  const matrix = mat4.create();
  const projectionMatrix = mat4.create();
  const viewMatrix = mat4.create();
  mat4.scale(matrix, matrix, scaling);
  mat4.translate(matrix, matrix, translation);
  mat4.rotateX(matrix, matrix, deg2Rad(rotation[0]));
  mat4.rotateY(matrix, matrix, deg2Rad(rotation[1]));
  mat4.rotateZ(matrix, matrix, deg2Rad(rotation[2]));
  mat4.perspective(projectionMatrix,
      deg2Rad(fieldOfViews), //vertical angle
      canvas.width/canvas.height, // aspect W/H
      1e-4, // near full distance how close z near
      1e4, // z-far
  );
  mat4.translate(viewMatrix, viewMatrix, cameraPos);
  mat4.invert(viewMatrix, viewMatrix);
  
  mat4.multiply(matrix, viewMatrix, matrix);
  mat4.multiply(matrix, projectionMatrix, matrix)
  return matrix
}
const uniformLocations = {
    matrix1: gl1.getUniformLocation(program1, `matrix`),
    matrix2: gl2.getUniformLocation(program2, `matrix`),
};

var translation = [0, 0, 0];
var rotation = [0, 0, 0];
var scaling = [1, 1, 1];
var fieldOfViews = 140;
var cameraPos = [0, 0, 1]
// mat4.translate(matrix, matrix, [.2, .5, -2]);
function draw_scene() {
    // requestAnimationFrame(animate);
    console.log(fieldOfViews)
   
   // mat4.rotateX(matrix, matrix, Math.PI/2 / 70);
    matrix1 = computeMatrix(canvas1, scaling, translation, rotation, fieldOfViews, cameraPos); 
    matrix2 = computeMatrix(canvas2, scaling, translation, rotation, fieldOfViews, cameraPos); 
    // mat4.multiply(finalMatrix, projectionMatrix, matrix);
    // gl.uniformMatrix4fv(uniformLocations.matrix, false, finalMatrix);
    // gl.uniformMatrix4fv(uniformLocations.matrix, false, matrix);
    // gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3);
    gl1.uniformMatrix4fv(uniformLocations.matrix1, false, matrix1);
    gl2.uniformMatrix4fv(uniformLocations.matrix2, false, matrix2);
    // gl.enable(gl.SCISSOR_TEST)
    // LEFT
    // gl.scissor(0, 0, 493, 592)
    // gl.viewport(0, 0, 493, 592)
    gl1.clearColor(0.12, 0.24, 0.56, 1.0);
    gl1.clear(gl1.COLOR_BUFFER_BIT );
    gl2.clearColor(0.20, 0.44, 0.16, 1.0);
    gl2.clear(gl2.COLOR_BUFFER_BIT );

    gl1.drawArrays(gl1.TRIANGLES, 0, vertices.length/3);
    // RIGHT
    // gl.scissor(493, 0, 1031, 592)
    // gl.viewport(493, 0, 1031, 592)
    
    gl2.drawArrays(gl2.TRIANGLES, 0, vertices.length/3);
}
// gl.uniformMatrix4fv(uniformLocations.matrix, false, matrix);
// gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3);

draw_scene();

// gl.enable(gl.SCISSOR_TEST)
// // LEFT
// gl.scissor(0, 0, 493, 592)
// gl.viewport(0, 0, 493, 592)
// gl.uniformMatrix4fv(uniformLocations.matrix, false, matrix);
// gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3);
// // RIGHT
// gl.scissor(493, 0, 1031, 592)
// gl.viewport(493, 0, 1031, 592)
// mat4.rotateY(matrix, matrix, Math.PI/2 /70);
// gl.uniformMatrix4fv(uniformLocations.matrix, false, matrix);
// gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3);
$(document).ready (function (){
  $("#translatex").on("input change", (e) => {
    translation[0] = parseFloat(e.target.value)
    draw_scene()
  });
  $("#translatey").on("input change", (e) => {
    translation[1] = parseFloat(e.target.value)
    draw_scene()
  });
  $("#translatez").on("input change", (e) => {
    translation[2] = parseFloat(e.target.value)
    draw_scene()
  });

  $("#scalex").on("input change", (e) => {
    scaling[0] = parseFloat(e.target.value)
    draw_scene()
  });
  $("#scaley").on("input change", (e) => {
    scaling[1] = parseFloat(e.target.value)
    draw_scene()
  });
  $("#scalez").on("input change", (e) => {
    scaling[2] = parseFloat(e.target.value)
    draw_scene()
  });
  $("#rotateX").on("input change", (e) => {
    rotation[0] = parseInt(e.target.value)
    draw_scene()
  });
  
  $("#rotateY").on("input change", (e) => {
    rotation[1] = parseInt(e.target.value)
    draw_scene()
  });
  
  $("#rotateZ").on("input change", (e) => {
    rotation[2] = parseInt(e.target.value)
    draw_scene()
  });
  $("#fieldOfViews").on("input change", (e) => {
    fieldOfViews = parseInt(e.target.value)
    draw_scene()
  });
  $("#CameraViewX").on("input change", (e) => {
    cameraPos[0] = parseFloat(e.target.value)
    draw_scene()
  });
  $("#CameraViewY").on("input change", (e) => {
    cameraPos[1] = parseFloat(e.target.value)
    draw_scene()
  });
  $("#CameraViewZ").on("input change", (e) => {
    cameraPos[2] = parseFloat(e.target.value)
    draw_scene()
  });
});









