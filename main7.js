function deg2Rad(d) {
  return d * Math.PI / 180;
}

// var vertexCode = `
// precision mediump float;
// vec2 position;
// vec2 texCoord;
// varying vec2 vTexCoord;
// void main() {
    
//     gl_Position = vec4(position, 0, 1);
//     vTexCoord = texCoord;
// }
// `;

var vertexCode = `
attribute vec4 position;
attribute vec2 texCoord;
uniform mat4 matrix;
// uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
    // vec2 zeroToOne = position / u_resolution;
  
    // vec2 zeroToTwo = zeroToOne * 2.0;
 
    // vec2 clipSpace = zeroToTwo - 1.0;
 
    // gl_Position = matrix*vec4(clipSpace *vec2(1, -1), 0, 1);
    gl_Position = matrix*position;
    v_texCoord = texCoord;
}
`

// var fragmentCode = `
// precision mediump float;
// uniform sampler2D textureID;
// varying vec2 vTexCoord;

// void main() {
//     gl_FragColor = texture2D(textureID, vTexCoord);
// }
// `;

var fragmentCode = `
precision mediump float;

// our texture
uniform sampler2D u_image;

varying vec2 v_texCoord;

void main() {
   gl_FragColor = texture2D(u_image, v_texCoord);
}
`
const canvas = document.getElementById('canvas');

gl = canvas.getContext('webgl');

if (!gl) {
    throw new Error("WebGL is not supported")
}

function loadImage(gl, path, kindTexture, translationX, translationY, rotaitonZ, scaleFactor=1) {
    var image = new Image();
    image.crossOrigin = "anonymous";
    image.src = path;
    image.onload = function () {
    // gl.clearColor(0, 20, 50, 1);
    // gl.clear(gl.COLOR_BUFFER_BIT);
        render(canvas, gl, image, kindTexture, translationX, translationY, rotaitonZ, scaleFactor);
}
}



function render(canvas, gl, image, kindTexture, translationX, translationY, rotationZ, scaleFactor=1) {
    
    var program = createProgram(gl, vertexCode, fragmentCode);
    var positionLocation = gl.getAttribLocation(program, "position");
    var texCoordLocation = gl.getAttribLocation(program, "texCoord");
    const uniformLocations = {
        transformMatrix: gl.getUniformLocation(program, `matrix`),
        u_image: gl.getUniformLocation(program, `u_image`),
    };
    // var textureLocation = gl.getUniformLocation(program, "textureID");
    
    //...
    mapVal = image.width/image.height/2;
    // setRectangle(gl, 0, 0, image.width, image.height);
    var vertices = [
        -mapVal, 0.5,
        -mapVal, -0.5,
        mapVal, 0.5,
        mapVal, -0.5,
    ]
    var texCoord = [
        0.0, 1.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0,
    ]
    
    var buffer = initBuffer(gl, program, vertices, texCoord)

    
    var texture = gl.createTexture();
    
    var u_image = uniformLocations.u_image;
    loadTexture(gl, texture, u_image, image, kindTexture);
  
    gl.useProgram(program);
   
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.positionBuffer);

    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionLocation, size, type, normalize, stride, offset);

    // Turn on the texcoord attribute
    gl.enableVertexAttribArray(texCoordLocation);

    // bind the texcoord buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.texcoordBuffer);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        texCoordLocation, size, type, normalize, stride, offset);
    
    
    // gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    // Draw the rectangle.
    var translation = [0, 0.5, 0];
    var rotation = [0, 0, 0];
    var scaling = [scaleFactor, scaleFactor, 1];
    var fieldOfViews = 140;
    var cameraPos = [0, 0, 1]
    translation[0]= translationX;
    translation[1]= translationY;
    rotation[2] = rotationZ;
    matrix = computeMatrix(canvas, scaling, translation, rotation, fieldOfViews, cameraPos);
    gl.uniformMatrix4fv(uniformLocations.transformMatrix, false, matrix);
    draw_scene(gl);
    // translation[1]= -0.5;
    // rotation[2] = 180;
    // matrix = computeMatrix(canvas, scaling, translation, rotation, fieldOfViews, cameraPos);
    // gl.uniformMatrix4fv(uniformLocations.transformMatrix, false, matrix);

    // draw_scene(gl);
    
}

function initVertexBuffer(gl, vertices) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
    gl.STATIC_DRAW);

}

// function setRectangle(gl, x, y, width, height) {
//     var x1 = x;
//     var x2 = x + width;
//     var y1 = y;
//     var y2 = y + height;
//     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
//        x1, y1,
//        x2, y1,
//        x1, y2,
//        x1, y2,
//        x2, y1,
//        x2, y2,
//     ]), gl.STATIC_DRAW);
//   }

function loadTexture(gl, texture, u_image, image, activeTexture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(activeTexture);
    
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    // gl.uniform1i(u_image, 0);

    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
}

// function initTexture(gl, n, program, path) {
//     var texture = gl.createTexture()
//     var u_image = gl.getUniformLocation(program, 'u_image');
//     var image = new Image();
//     image.crossOrigin = "anonymous";
//     image.onload = () => {
//         loadTexture(gl, n, texture, u_image, image);
//     }
//     image.src = path

//     return true;
// }

function createProgram(gl, vertexCode, fragmentCode) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexCode);
    gl.compileShader(vertexShader);
  
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentCode);
    gl.compileShader(fragmentShader);
  
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
}

function initBuffer(gl, program, vertices, texCoord) {
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  
    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoord), gl.STATIC_DRAW);
    return {positionBuffer, texcoordBuffer}
}

function draw_scene(gl) {
    var primitiveType = gl.TRIANGLE_STRIP;
    var offset  = 0;
    var count = 4;
    
    gl.drawArrays(primitiveType, offset, count);
}

function computeMatrix(canvas, scaling, translation, rotation, fieldOfViews, cameraPos) {
    const matrix = mat4.create();
    // const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    mat4.scale(matrix, matrix, scaling);
    mat4.translate(matrix, matrix, translation);
    mat4.rotateX(matrix, matrix, deg2Rad(rotation[0]));
    mat4.rotateY(matrix, matrix, deg2Rad(rotation[1]));
    mat4.rotateZ(matrix, matrix, deg2Rad(rotation[2]));
    // mat4.perspective(projectionMatrix,
    //     deg2Rad(fieldOfViews), //vertical angle
    //     canvas.width/canvas.height, // aspect W/H
    //     1e-4, // near full distance how close z near
    //     1e4, // z-far
    // );
    // mat4.translate(viewMatrix, viewMatrix, cameraPos);
    // mat4.invert(viewMatrix, viewMatrix);
    
    mat4.multiply(matrix, viewMatrix, matrix);
    // mat4.multiply(matrix, projectionMatrix, matrix)
    return matrix
  }


 
  
  
loadImage(gl, "img/left.png", gl.TEXTURE0, -1, 0, 90, 0.4)
loadImage(gl, "img/right.png", gl.TEXTURE0, 1, 0, -90, 0.4)
loadImage(gl, "img/front.png", gl.TEXTURE0, 0, 1, 0, 0.4)
loadImage(gl, "img/rear.png", gl.TEXTURE0, 0, -1, 180, 0.4)


// let promise = new Promise((resolve, reject) => {
//     loadImage(gl, "img/front.png", gl.TEXTURE0, 0, 0.5, 0)
// })
// .then(() => {
//     loadImage(gl, "img/rear.png", gl.TEXTURE1, 0, -0.5, 180)
// })
// .then(() => {
//     draw_scene(gl);
// })
