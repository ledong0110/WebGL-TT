const canvas1 = document.getElementById('canvas1');
const canvas2 = document.getElementById('canvas2');
gl = canvas1.getContext('experimental-webgl');
gl2 = canvas2.getContext('experimental-webgl');
if (!gl || !gl2) {
    throw new Error("WebGL is not supported")
}
function deg2Rad(d) {
  return d * Math.PI / 180;
}




function requestCORSIfNotSameOrigin(img, url) {
    if ((new URL(url, window.location.href)).origin !== window.location.origin) {
        img.crossOrigin = "";
    }
}

// creates a texture info { width: w, height: h, texture: tex }
// The texture will start with 1x1 pixels and be updated
// when the image has loaded
function loadTexture(url) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                    new Uint8Array([0, 0, 255, 255]));

    // let's assume all images are not a power of 2
    
    var textureInfo = {
        width: 1,   // we don't know the size until it loads
        height: 1,
        texture: tex,
    };
    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = (e) => {
        textureInfo.width = img.width;
        textureInfo.height = img.height;

        gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.generateMipmap(gl.TEXTURE_2D)
    };
    // requestCORSIfNotSameOrigin(img, url);
    img.src = url;

    return textureInfo;
}

function initBuffer(gl, vertices, uvData) {
  

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); 
  
   
    const uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvData), gl.STATIC_DRAW); 
    
   
    return {
      positionBuffer: positionBuffer,
      uvBuffer: uvBuffer
    };
  }
  
  function initShaderProgram(gl) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `
    precision mediump float;
  
    attribute vec3 position;
    attribute vec3 color;
    attribute vec2 uv;
  
    varying vec2 vUV;
    varying vec3 vColor;
  
    uniform mat4 matrix;
   
  
    void main() {
        vColor = color;
        vUV = uv;
        gl_Position = vec4(position, 1.0);
        // gl_PointSize = 10.0;
    }
    `);
    gl.compileShader(vertexShader);
  
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, `
    precision mediump float;
    varying vec2 vUV;
    uniform sampler2D textureID;
    varying vec3 vColor;
  
    void main() {
        
        gl_FragColor = texture2D(textureID, vUV);
    }
    `);
    gl.compileShader(fragmentShader);
  
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
  
    return program
  }

const front = loadTexture('img/brick.png', gl);
// gl.activeTexture(gl.TEXTURE0);
// gl.bindTexture(gl.TEXTURE_2D, front);

// const rear = loadTexture('img/rear.png', gl);
// gl.activeTexture(gl.TEXTURE0);
// gl.bindTexture(gl.TEXTURE_2D, rear);

// const left = loadTexture('img/rear.png', gl);
// gl.activeTexture(gl.TEXTURE0);
// gl.bindTexture(gl.TEXTURE_2D, left);

// const right = loadTexture('img/rear.png', gl);
// gl.activeTexture(gl.TEXTURE0);
// gl.bindTexture(gl.TEXTURE_2D, right);

const texcoords = [
    0, 0, 0,
    0, 1, 0,
    1, 0, 0,

    1, 0, 0,
    0, 1, 0,
    1, 1, 0,
  ];

const vertices = [
    -1, -1,
    -1, 1,
    1, -1,
    1, -1,
    -1, 1,
    1, 1,
];




gl.clear(gl.COLOR_BUFFER_BIT);

buffer = initBuffer(gl, vertices, texcoords);
program = initShaderProgram(gl)
const uniformLocations = {
    matrix: gl.getUniformLocation(program, `matrix`),
    textureID: gl.getUniformLocation(program, "textureID"),
};
gl.activeTexture(gl.TEXTURE1);
gl.bindTexture(gl.TEXTURE_2D, front.texture);
gl.useProgram(program);

const positionLocation = gl.getAttribLocation(program, `position`)
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, buffer.positionBuffer)
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0 ,0);

const uvLocation = gl.getAttribLocation(program, `uv`)
gl.enableVertexAttribArray(uvLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, buffer.uvBuffer)
gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, 0 ,0);

gl.uniform1i(uniformLocations.textureID, 0);

gl.drawArrays(gl.TRIANGLES, 0, 6)