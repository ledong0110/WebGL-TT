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
     
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
  
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    } 
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




async function main(images, alphas) {
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl", {premultipliedAlpha: false});
    if (!gl) {
        // return;
    }
   
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

    const texCoordVideo = [
        //Cam 2
        0, 0,
        0, 0.5,
        0.5, 0,
        0, 0.5,
        0.5, 0.5,
        0.5, 0,
        //Cam 3
        0.5, 0,
        0.5, 0.5,
        1, 0,
        0.5, 0.5,
        1, 0.5,
        1, 0,
        //Cam 0
        0, 0.5,
        0, 1,
        0.5, 0.5,
        0, 1,
        0.5, 1,
        0.5, 0.5,
        //Cam1
        0.5, 0.5,
        0.5, 1,
        1, 0.5,
        0.5, 1,
        1, 1,
        1, 0.5

    ];

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
    
    const positionLocation = gl.getAttribLocation(program, `position`)
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0 ,0);
    
   
    
    const texUniformLocation = gl.getUniformLocation(program, "u_image");
    const alphaUniformLocation = gl.getUniformLocation(program, "u_alpha")
    
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
    
    let texture0 = loadTexture(gl, images[0]);
    let texture1 = loadTexture(gl, images[1]);
    let texture2 = loadTexture(gl, images[2]);
    let texture3 = loadTexture(gl, images[3]);
    let texturealpha0 = loadTexture(gl, alphas[0]);
    let texturealpha1 = loadTexture(gl, alphas[1]);
    let texturealpha2 = loadTexture(gl, alphas[2]);
    let texturealpha3 = loadTexture(gl, alphas[3]);
    

    const matrixUniform = gl.getUniformLocation(program, `matrix`)
    const matrix = mat4.create();
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 170*Math.PI/180, gl.canvas.clientWidth/gl.canvas.clientHeight, 0.01 ,1000000)
    mat4.scale(matrix, matrix, [1*0.05, 1*0.05/canvas.height*canvas.width, 1]);
    // requestAnimationFrame(animate);
    // mat4.rotateY(matrix, matrix, Math.PI/2);
    // mat4.rotateZ(matrix, matrix, -Math.PI/2 );
    // mat4.translate(matrix, [1,-0.4,0])
    mat4.rotateX(matrix, matrix, Math.PI/2 );
    // mat4.mul/tiply(matrix, projectionMatrix, matrix);
    // gl.uniformMatrix4fv(uniformLocations.matrix, false, finalMatrix);
    gl.uniformMatrix4fv(matrixUniform, false, matrix);
    
    function animate() {
        
        gl.drawArrays(gl.TRIANGLES, 0, extractArray.positions.length/3);
    }

    let texLocation = gl.getAttribLocation(program, `texCoord`)
    gl.bindBuffer(gl.ARRAY_BUFFER, calib0Buffer)
    gl.enableVertexAttribArray(texLocation);
    gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 0 ,0);
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
    
    // Texture 3
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture3);
    gl.uniform1i(texUniformLocation, 0);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texturealpha3);
    gl.uniform1i(alphaUniformLocation, 1);
    // gl.uniformMatrix4fv(matrixUniform, false, matrix);
    animate()
 
   
    // gl.bindBuffer(gl.ARRAY_BUFFER, calib2Buffer)
    // gl.enableVertexAttribArray(texLocation);
    // gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 0 ,0);
    
    
    gl.uniformMatrix4fv(matrixUniform, false, matrix);
    texLocation = gl.getAttribLocation(program, `texCoord`)
    gl.bindBuffer(gl.ARRAY_BUFFER, calib1Buffer)
    gl.enableVertexAttribArray(texLocation);
    gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 0 ,0);
    // Texture 1
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
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
    // //Texture 2
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.uniform1i(texUniformLocation, 0);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texturealpha2);
    gl.uniform1i(alphaUniformLocation, 1);
    gl.uniformMatrix4fv(matrixUniform, false, matrix);
    animate()

    
}


loadImages(["img/img0.png", "img/img1.png", "img/img2.png", "img/img3.png"],[ "obj/alpha/alpha_TV_0.png", "obj/alpha/alpha_TV_1.png", "obj/alpha/alpha_TV_2.png", "obj/alpha/alpha_TV_0.png"], main)
