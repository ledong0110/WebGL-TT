
const canvas = document.getElementById('my_canvas');
gl = canvas.getContext('experimental-webgl');
if (!gl) {
    throw new Error("WebGL is not supported")
}
// Set list vertices vertexData = [...]

// Create buffer

// Load vertice list to buffer


// Create vertex shader


//create fragment shader


// Create program


// Attack shaders to program


// Enable vertex attribute

// draw
 

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

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); 


const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorData), gl.STATIC_DRAW); 

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, `
precision mediump float;

attribute vec3 position;
attribute vec3 color;
varying vec3 vColor;

uniform mat4 matrix;
uniform mat4 projection_matrix;

void main() {
    vColor = color;
    gl_Position = matrix * vec4(position, 1.0);
    gl_PointSize = 10.0;
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

const positionLocation = gl.getAttribLocation(program, `position`)
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0 ,0);

const colorLocation = gl.getAttribLocation(program, `color`)
gl.enableVertexAttribArray(colorLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0 ,0);

gl.useProgram(program);
gl.enable(gl.DEPTH_TEST);

const uniformLocations = {
    matrix: gl.getUniformLocation(program, `matrix`),
};

const matrix = mat4.create();
const projectionMatrix = mat4.create()
mat4.perspective(projectionMatrix,
    120 * Math.PI/180,
    canvas.width/canvas.clientHeight,
    1e-4,
    1e4,
);

const finalMatrix = mat4.create()
// mat4.translate(matrix, matrix, [.2, .5, 0]);
mat4.scale(matrix, matrix, [0.75, 0.75, 0.75]);
// mat4.translate(matrix, matrix, [.2, .5, -2]);
function animate() {
    requestAnimationFrame(animate);
    mat4.rotateY(matrix, matrix, Math.PI/2 /70);
   // mat4.rotateX(matrix, matrix, Math.PI/2 / 70);
     mat4.rotateZ(matrix, matrix, Math.PI/2 / 70);
    // mat4.multiply(finalMatrix, projectionMatrix, matrix);
    // gl.uniformMatrix4fv(uniformLocations.matrix, false, finalMatrix);
    gl.uniformMatrix4fv(uniformLocations.matrix, false, matrix);
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length/3);
}

animate();