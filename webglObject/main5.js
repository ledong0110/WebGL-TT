const carvs = `
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

const carfs = `
  precision mediump float;

// our texture
uniform sampler2D u_image;

varying vec2 v_texCoord;

void main() {
    gl_FragColor = texture2D(u_image, v_texCoord);
}
  `;


function loadVideo(url, callback) {
    const video = document.createElement("video");
  
    let playing = false;
    let timeupdate = false;
  
    video.playsInline = true;
    video.muted = true;
    video.loop = true;
  
    // Waiting for these 2 events ensures
    // there is data in the video
  
    video.addEventListener(
      "playing",
      () => {
        playing = true;
        callback()
      },
      true
    );
  
    video.addEventListener(
      "timeupdate",
      () => {
        timeupdate = true;
        // callback();
      },
      true
    );
  
    video.src = url;
    video.play();
  
    
  
    return video;
  }

function loadVideoAndImages(urls, alphaurls, carImg, callback) {
    var videoLoad;
    var car;
    var alphas = [];
    var imagesAndVideosToLoad =alphaurls.length +2;
    // Called each time an image finished loading.
    var onVideoLoad = function() {
      --imagesAndVideosToLoad;
      console.log(imagesAndVideosToLoad)
      // If all the images are loaded call the callback.
      if (imagesAndVideosToLoad == 0) {
        console.log("Loaded")
        callback(videoLoad, alphas, car);
      }
    };
   
    var videoLoad = loadVideo(urls, onVideoLoad);
  
    for (var ii = 0; ii < imagesAndVideosToLoad-2; ++ii) {
      var alpha = loadImage(alphaurls[ii], onVideoLoad);
      alphas.push(alpha);
    }
    car = loadImage(carImg, onVideoLoad);
  }


function loadImage(url, callback) {
    var image = new Image();
    image.src = url;
    image.onload = callback;
    return image;
}
function resizeCanvasToDisplaySize(canvas) {
    const dpr = window.devicePixelRatio;
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const {width, height} = canvas.getBoundingClientRect();
    const displayWidth  = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);
   
    // Check if the canvas is not the same size.
    const needResize = canvas.width  !== displayWidth ||
                       canvas.height !== displayHeight;
   
    if (needResize) {
      // Make the canvas the same size
      canvas.width  = displayWidth;
      canvas.height = displayHeight;
    }
   
    return needResize;
  }
function loadImages(urls, alphaurls, callback) {
    var images = [];
    var alphas = [];
    var imagesToLoad = urls.length + alphaurls.length;
   
    // Called each time an image finished loading.
    var onImageLoad = function() {
      --imagesToLoad;
      // If all the images are loaded call the callback.
      if (imagesToLoad == 0) {
        callback(images, alphas);
      }
    };
   
    for (var ii = 0; ii < imagesToLoad/2; ++ii) {
      var image = loadImage(urls[ii], onImageLoad);
      images.push(image);
      var alpha = loadImage(alphaurls[ii], onImageLoad);
      alphas.push(alpha);
    }
  }


function loadTexture(gl, image) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    srcFormat,
    srcType,
    image
    );
     
  

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    
    return texture;
}
function updateTexture(gl, texture, image) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
  gl.TEXTURE_2D,
  level,
  internalFormat,
  srcFormat,
  srcType,
  image
  );

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  
  return texture;

}
function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function setTextureAttribute(gl, texBuffer, texLocation) {
    const num = 2; // every coordinate composed of 2 values
    const type = gl.FLOAT; // the data in the buffer is 32-bit float
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set to the next
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.vertexAttribPointer(
      texLocation,
      num,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(texLocation);
}


function repeat(n, pattern) {
    let array = []
    for (let i = 0; i < n; i++)
        array.push(...pattern)
    return array;
}

async function main(video, alphas, carimg) {
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, premultipliedAlpha: false});
    if (!gl) {
        // return;
    }
    // const carresponse = await fetch('obj/E34_Body.obj');  
    // const cartext = await carresponse.text();
    // let carobj = new GLParseVisitor().visit(parser(cartext))[0]
    
    const bowlTopviewReq = await fetch('obj/bowl_topview.obj');  
    const bowlTopviewText = await bowlTopviewReq.text();

    const calibCam0Req = await fetch('obj/calib_cam0_topview.txt');  
    const calibCam0Text = await calibCam0Req.text();
    const calibCam0 = calibCam0Text.split(/\n+|\s+/).map(parseFloat);

    const calibCam1Req = await fetch('obj/calib_cam1_topview.txt');  
    const calibCam1Text = await calibCam1Req.text();
    const calibCam1 = calibCam1Text.split(/\n+|\s+/).map(parseFloat);
    
    const calibCam2Req = await fetch('obj/calib_cam2_topview.txt');  
    const calibCam2Text = await calibCam2Req.text();
    const calibCam2 = calibCam2Text.split(/\n+|\s+/).map(parseFloat);

    const calibCam3Req = await fetch('obj/calib_cam3_topview.txt');  
    const calibCam3Text = await calibCam3Req.text();
    const calibCam3 = calibCam3Text.split(/\n+|\s+/).map(parseFloat);


    const obj = parser(bowlTopviewText);
    const visitor = new GLParseVisitor();
    // 0: postion 1: color 2: normals 3: texcoord
    let extractArray = visitor.visit(obj)[0];
    
    
    const vs = await (await fetch('shader/vertexShader.glsl')).text()
    const fs = await (await fetch('shader/fragmentShader.glsl')).text()
    
    Shader.setCode(vs, fs);
    let program = new Shader(gl).createProgram()
    let positionBuffer = BufferInitialization.init(gl, extractArray.positions, gl.ARRAY_BUFFER)
    
    let calib0Buffer = BufferInitialization.init(gl, calibCam0, gl.ARRAY_BUFFER);
    let calib1Buffer = BufferInitialization.init(gl, calibCam1, gl.ARRAY_BUFFER);
    let calib2Buffer = BufferInitialization.init(gl, calibCam2, gl.ARRAY_BUFFER);
    let calib3Buffer = BufferInitialization.init(gl, calibCam3, gl.ARRAY_BUFFER);
    let cutTexCam0 = BufferInitialization.init(gl, repeat(parseInt(calibCam0.length/2),[0,0.5]), gl.ARRAY_BUFFER);
    let cutTexCam1 = BufferInitialization.init(gl, repeat(parseInt(calibCam1.length/2),[0.5,0.5]), gl.ARRAY_BUFFER);
    let cutTexCam2 = BufferInitialization.init(gl, repeat(parseInt(calibCam2.length/2),[0,0]), gl.ARRAY_BUFFER);
    let cutTexCam3 = BufferInitialization.init(gl, repeat(parseInt(calibCam3.length/2),[0.5,0]), gl.ARRAY_BUFFER);

    const positionLocation = gl.getAttribLocation(program, `position`)
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0 ,0);
    
   
    
    const texUniformLocation = gl.getUniformLocation(program, "u_image");
    const alphaUniformLocation = gl.getUniformLocation(program, "u_alpha");
    
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    // gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    // gl.enable(gl.BLEND);
    // gl.blendEquation(gl.FUNC_ADD);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ON);
    // gl.disable(gl.CULL_FACE)
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    // gl.disable(gl.DEPTH_TEST);
    resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(program);
    // gl.enable(gl.DEPTH_TEST);
    

    const matrixUniform = gl.getUniformLocation(program, `matrix`)
    const matrix = mat4.create();
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 170*Math.PI/180, gl.canvas.clientWidth/gl.canvas.clientHeight, 0.01 ,1000000)
    mat4.scale(matrix, matrix, [1*0.08, 1*0.08/canvas.height*canvas.width, 0.08*canvas.width]);
    // requestAnimationFrame(animate);
    // mat4.rotateY(matrix, matrix, Math.PI/2);
    mat4.rotateZ(matrix, matrix, -Math.PI );
    // mat4.translate(matrix, [1,-0.4,0])
    mat4.rotateX(matrix, matrix, Math.PI/2 );
    // mat4.mul/tiply(matrix, projectionMatrix, matrix);
    // gl.uniformMatrix4fv(uniformLocations.matrix, false, finalMatrix);
    gl.uniformMatrix4fv(matrixUniform, false, matrix);
    
    function animate() {
        
        gl.drawArrays(gl.TRIANGLES, 0, extractArray.positions.length/3);
    }
    let texture0 = loadTexture(gl, video);
    let texturealpha0 = loadTexture(gl, alphas[0]);
    let texturealpha1 = loadTexture(gl, alphas[1]);
    let texturealpha2 = loadTexture(gl, alphas[2]);
    let texturealpha3 = loadTexture(gl, alphas[3]);
    
    console.log(calibCam0)
    let fps = 25;
    
    // carImg = new CarModelLoading(gl, canvas, 'obj/E34_Tex_Luxury_Blue.bmp', vs, fs);
    
    function render() {
      
        // requestAnimationFrame(render)
        texture0 = updateTexture(gl, texture0, video)
        // let texture1 = loadTexture(gl, video);
        // let texture2 = loadTexture(gl, video);
        // let texture3 = loadTexture(gl, video);
        let texLocation = gl.getAttribLocation(program, `texCoord`)
        gl.bindBuffer(gl.ARRAY_BUFFER, calib0Buffer)
        gl.enableVertexAttribArray(texLocation);
        gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 0 ,0);
        let cutTexLocation = gl.getAttribLocation(program, `cutTexCoord`);
        gl.bindBuffer(gl.ARRAY_BUFFER, cutTexCam0)
        gl.enableVertexAttribArray(cutTexLocation);
        gl.vertexAttribPointer(cutTexLocation, 2, gl.FLOAT, false, 0 ,0);
        // Texture 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.uniform1i(texUniformLocation, 0);
    
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texturealpha0);
        gl.uniform1i(alphaUniformLocation, 1);
        // gl.uniformMatrix4fv(matrixUniform, false, matrix);
        
        
        animate();


        texLocation = gl.getAttribLocation(program, `texCoord`)
        gl.bindBuffer(gl.ARRAY_BUFFER, calib3Buffer)
        gl.enableVertexAttribArray(texLocation);
        gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 0 ,0);
        cutTexLocation = gl.getAttribLocation(program, `cutTexCoord`);
        gl.bindBuffer(gl.ARRAY_BUFFER, cutTexCam3)
        gl.enableVertexAttribArray(cutTexLocation);
        gl.vertexAttribPointer(cutTexLocation, 2, gl.FLOAT, false, 0 ,0);
        // Texture 3
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.uniform1i(texUniformLocation, 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texturealpha3);
        gl.uniform1i(alphaUniformLocation, 1);
        // gl.uniformMatrix4fv(matrixUniform, false, matrix);
        animate()
    
    
        // gl.bindBuffer(gl.ARRAY_BUFFER, calib2Buffer)
        // gl.enableVertexAttribArray(texLocation);
        // gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 0 ,0);
        
        
        // gl.uniformMatrix4fv(matrixUniform, false, matrix);
        texLocation = gl.getAttribLocation(program, `texCoord`)
        gl.bindBuffer(gl.ARRAY_BUFFER, calib1Buffer)
        gl.enableVertexAttribArray(texLocation);
        gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 0 ,0);
        cutTexLocation = gl.getAttribLocation(program, `cutTexCoord`);
        gl.bindBuffer(gl.ARRAY_BUFFER, cutTexCam1)
        gl.enableVertexAttribArray(cutTexLocation);
        gl.vertexAttribPointer(cutTexLocation, 2, gl.FLOAT, false, 0 ,0);
        // Texture 1
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.uniform1i(texUniformLocation, 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texturealpha1);
        gl.uniform1i(alphaUniformLocation, 1);
        gl.uniformMatrix4fv(matrixUniform, false, matrix);
        animate()
        
        texLocation = gl.getAttribLocation(program, `texCoord`)
        gl.bindBuffer(gl.ARRAY_BUFFER, calib2Buffer)
        gl.enableVertexAttribArray(texLocation);
        gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 0 ,0);
        cutTexLocation = gl.getAttribLocation(program, `cutTexCoord`);
        gl.bindBuffer(gl.ARRAY_BUFFER, cutTexCam2)
        gl.enableVertexAttribArray(cutTexLocation);
        gl.vertexAttribPointer(cutTexLocation, 2, gl.FLOAT, false, 0 ,0);
        // //Texture 2
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture0);
        gl.uniform1i(texUniformLocation, 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texturealpha2);
        gl.uniform1i(alphaUniformLocation, 1);
        // gl.uniformMatrix4fv(matrixUniform, false, matrix);
        animate()

        // carImg.load_car();
        setTimeout(() => {
              requestAnimationFrame(render);
            }, 1000 / fps);
        }
        requestAnimationFrame(render)
        // carImg.loadImage('center', carobj.texCoord, 0.07, ImageLoading.globalScale, carobj.positions);
}
function recordCanvas(canvas, videoLength) {
  const recordedChunks = [];
  const mediaRecorder = new MediaRecorder(
    canvas.captureStream(25), {mimeType: 'video/webm; codecs=vp9'});
  mediaRecorder.ondataavailable = 
    event => recordedChunks.push(event.data);
  mediaRecorder.onstop = () => {
    const url = URL.createObjectURL(
      new Blob(recordedChunks, {type: "video/webm"}));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "video.webm";
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
  mediaRecorder.start();
  window.setTimeout(() => {mediaRecorder.stop();}, videoLength);
}
loadVideoAndImages("video/video_in.mp4",[ "obj/alpha/alpha_TV_0.png", "obj/alpha/alpha_TV_1.png", "obj/alpha/alpha_TV_2.png", "obj/alpha/alpha_TV_0.png"], "obj/E34_Tex_Luxury_Blue.bmp", main)
// recordCanvas(document.querySelector("#canvas"), 2*60*1000)