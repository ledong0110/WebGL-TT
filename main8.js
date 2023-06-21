function deg2Rad(d) {
    return d * Math.PI / 180;
  }
  
  
var vertexCode = `
attribute vec4 position;
attribute vec2 texCoord;
uniform mat4 matrix;
// uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
    gl_Position = matrix*position;
    v_texCoord = texCoord;
}
`

  
var fragmentCode = `
precision mediump float;

// our texture
uniform sampler2D u_image;

varying vec2 v_texCoord;

void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
}
`


function loadImage(gl, canvas, path, imgType, kindTexture, translationX, translationY, rotaitonZ, scaleFactor=1) {
    var image = new Image();
    image.crossOrigin = "anonymous";
    image.src = path;
    image.onload = function () {
    // gl.clearColor(0, 20, 50, 1);
    // gl.clear(gl.COLOR_BUFFER_BIT);
        render(canvas, gl, image, imgType, kindTexture, translationX, translationY, rotaitonZ, scaleFactor);
}
}



function render(canvas, gl, image, imgType, kindTexture, translationX, translationY, rotationZ, scaleFactor=1) {
    
    var program = createProgram(gl, vertexCode, fragmentCode);
    var positionLocation = gl.getAttribLocation(program, "position");
    var texCoordLocation = gl.getAttribLocation(program, "texCoord");
    const uniformLocations = {
        transformMatrix: gl.getUniformLocation(program, `matrix`),
        u_image: gl.getUniformLocation(program, `u_image`),
    };      
    //...
  
    // setRectangle(gl, 0, 0, image.width, image.height);
    mapVal = image.width/image.height/2;
    // clipSpaceX = mapVal * 2 / canvas.width  - 1
    // clipSpaceY = 1 * 2 / canvas.height - 1 
    // var vertices = [
    //     -clipSpaceX/2, clipSpaceY,
    //     -clipSpaceX/2, -clipSpaceY,
    //     clipSpaceX/2, clipSpaceY,
    //     clipSpaceX/2, -clipSpaceY,
    // ]
   
    var vertices = [ 
        -mapVal, 0.5,
        -mapVal, -0.5,
        mapVal, 0.5,
        mapVal, -0.5,
    ];
    // var vertices = [ 
    //     -0.5, 0.5,
    //     -0.5, -0.5,
    //     0.5, 0.5,
    //     0.5, -0.5,
    // ];
    var texCoord = [
        0.0, 1.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0,
    ]
    
    var buffer = initBuffer(gl, program, vertices, texCoord);

    
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
    
    // Transformation
    var translation = [0, 0, 0];
    var rotation = [0, 0, 0];
    // var scaling = [scaleFactor/canvas.width*800, scaleFactor/canvas.height*800, 1];
    var scaling = [scaleFactor/canvas.width*800, scaleFactor/canvas.height*800, 1];
    
       
    if (imgType == "left") {
        rotation[2] = -90;
        translation[0] = -1+0.5*scaling[0];
        translation[1] = 0;
    }
    else if (imgType == "right") {
        rotation[2] = 90;
        translation[0] = 1-0.5*scaling[0];
        translation[1] = 0;
    }
    else if (imgType == "front") {
        rotation[2] = 180;
        translation[1] = 1-0.5*scaling[1];
        translation[0] = 0;
        // translation[1] = (mapVal+0.5)*scaling[1];
        // // translation[1] = (mapVal+0.5)*scaling[1];
        // translation[0] = 0;
        // scaling[0] = (1-scaling[0])/(mapVal);
      
        // scaling[1] = scaling[1]/scaleFactor *(1-scaling[1])
    }
    else {
        rotation[2] = 0;
        // translation[1] = -(mapVal+0.5)*scaling[1];
        // translation[0] = 0;
        // scaling[0] = (1-scaling[0])/(mapVal);
        translation[1] = -(1-0.5*scaling[1]);
        translation[0] = 0;
    }
    // translation[0]= translationX;
    // translation[1]= translationY;
    // rotation[2] = rotationZ;
    matrix = computeMatrix(canvas, scaling, translation, rotation);
    // for (var i = 0; i < matrix.length; i+=4) {
    //     for (var j = i; j < i+4; j++) {
    //         console.log(matrix[i+j])
    //     }
    // }
    console.log(matrix)
    gl.uniformMatrix4fv(uniformLocations.transformMatrix, false, matrix);
    draw_scene(gl);
    
}

function initVertexBuffer(gl, vertices) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices),
    gl.STATIC_DRAW);

}


function loadTexture(gl, texture, u_image, image, activeTexture) {
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
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

function computeMatrix(canvas, scaling, translation, rotation) {
    const matrix = mat4.create();
    // const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    mat4.translate(matrix, matrix, translation);
    mat4.scale(matrix, matrix, scaling);
    // mat4.rotateX(matrix, matrix, deg2Rad(rotation[0]));
    // mat4.rotateY(matrix, matrix, deg2Rad(rotation[1]));
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



const canvas1 = document.getElementById('canvas1');

gl1 = canvas1.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha:true} );

if (!gl1) {
    throw new Error("WebGL is not supported")
}
gl1.clearColor(0, 0, 0, 1);
gl1.clear( gl1.COLOR_BUFFER_BIT | gl1.DEPTH_BUFFER_BIT );
const scaling = 0.4;
loadImage(gl1, canvas1, "img/left.png", "left", gl1.TEXTURE0, -1.3, 0, 90, scaling)
loadImage(gl1, canvas1, "img/right.png", "right", gl1.TEXTURE0, 1.2, 0,-90, scaling)
loadImage(gl1, canvas1, "img/front.png", "front", gl1.TEXTURE0, 0, 1.3, 180, scaling)
loadImage(gl1, canvas1, "img/rear.png", "rear", gl1.TEXTURE0, 0, -1.3, 0, scaling)


const canvas2 = document.getElementById('canvas2');

gl2 = canvas2.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha:true} );

if (!gl2) {
    throw new Error("WebGL is not supported")
}
gl2.clearColor(0, 0, 0, 1);
gl2.clear( gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT );
const scaling2 = 0.7;
loadImage(gl2, canvas2, "img/left.png", "left", gl2.TEXTURE0, -1.2, 0, 90, scaling2);
loadImage(gl2, canvas2, "img/right.png", "right", gl2.TEXTURE0, 1.2, 0, -90, scaling2);
loadImage(gl2, canvas2, "img/front.png", "front", gl2.TEXTURE0, 0, 1.2, 180, scaling2);
loadImage(gl2, canvas2, "img/rear.png", "rear", gl2.TEXTURE0, 0, -1.2, 0, scaling2);

