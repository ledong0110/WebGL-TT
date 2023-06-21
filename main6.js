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
attribute vec2 position;
attribute vec2 texCoord;

uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
    vec2 zeroToOne = position / u_resolution;
  
    vec2 zeroToTwo = zeroToOne * 2.0;
 
    vec2 clipSpace = zeroToTwo - 1.0;
 
    gl_Position = vec4(clipSpace *vec2(1, -1), 0, 1);
 
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

var image = new Image();
image.crossOrigin = "anonymous";
image.src = "img/rear.png";
image.onload = function () {
    render(image);
}

function render(image) {
    const canvas = document.getElementById('canvas');

    gl = canvas.getContext('webgl');

    if (!gl) {
        throw new Error("WebGL is not supported")
    }
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

    var positionLocation = gl.getAttribLocation(program, "position");
    var texCoordLocation = gl.getAttribLocation(program, "texCoord");
    // var textureLocation = gl.getUniformLocation(program, "textureID");
    
    //...
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setRectangle(gl, 0, 0, image.width, image.height);

    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        0.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0,
    ]), gl.STATIC_DRAW);

    var texture = gl.createTexture();
    // gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  
    var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
   
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    //...
    // canvas.width = 500;
    // canvas.height = 500;
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

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
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

    // Tell the texcoord attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        texCoordLocation, size, type, normalize, stride, offset);

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    // Draw the rectangle.
    var primitiveType = gl.TRIANGLES;
    var offset  = 0;
    var count = 6;
    gl.drawArrays(primitiveType, offset, count);
}

function setRectangle(gl, x, y, width, height) {
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
       x1, y1,
       x2, y1,
       x1, y2,
       x1, y2,
       x2, y1,
       x2, y2,
    ]), gl.STATIC_DRAW);
  }

