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
function loadImage(url, callback) {
    var image = new Image();
    image.src = url;
    image.onload = callback;
    return image;
}
function loadVideoAndImages(urls, alphaurls, callback) {
    var videoLoad;
    
    var alphas = [];
    var imagesAndVideosToLoad =alphaurls.length +1;
    // Called each time an image finished loading.
    var onVideoLoad = function() {
      --imagesAndVideosToLoad;
      console.log(imagesAndVideosToLoad)
      // If all the images are loaded call the callback.
      if (imagesAndVideosToLoad == 0) {
        console.log("Loaded")
        callback(videoLoad, alphas);
      }
    };
   
    var videoLoad = loadVideo(urls, onVideoLoad);
  
    for (var ii = 0; ii < imagesAndVideosToLoad-1; ++ii) {
      var alpha = loadImage(alphaurls[ii], onVideoLoad);
      alphas.push(alpha);
    }
   
}

function repeat(n, pattern) {
    let array = []
    for (let i = 0; i < n; i++)
        array.push(...pattern)
    return array;
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


async function main(video, alphas) {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl", {  premultipliedAlpha: false});
    if (!gl) {
        return;
    }


    const vs = await (await fetch('shader/vertexShader2.glsl')).text()
    const fs = await (await fetch('shader/fragmentShader2.glsl')).text()
    const program = new Shader(gl).createProgram(vs, fs);
//   program = program;
    

    const calibCam0Req = await fetch('obj/scalib/calib_cam0.txt');  
    const calibCam0Text = await calibCam0Req.text();
    const calibCam0 = calibCam0Text.split(/\n+|\s+/).map(parseFloat);

    const calibCam1Req = await fetch('obj/scalib/calib_cam1.txt');  
    const calibCam1Text = await calibCam1Req.text();
    const calibCam1 = calibCam1Text.split(/\n+|\s+/).map(parseFloat);

    const calibCam2Req = await fetch('obj/scalib/calib_cam2.txt');  
    const calibCam2Text = await calibCam2Req.text();
    const calibCam2 = calibCam2Text.split(/\n+|\s+/).map(parseFloat);

    const calibCam3Req = await fetch('obj/scalib/calib_cam3.txt');  
    const calibCam3Text = await calibCam3Req.text();
    const calibCam3 = calibCam3Text.split(/\n+|\s+/).map(parseFloat);

    const response = await fetch('obj/Elipsesphere.obj');  
    const text = await response.text();
    
    const obj2 = parser(text)
    
    const visitor = new GLParseVisitor();
    // 0: postion 1: color 2: normals 3: texcoord
    let extractArray = visitor.visit(obj2)[0];

    const svm = new SurroundingViewLoading(
      gl, 
      canvas, 
      video, 
      alphas, 
      extractArray,
      [calibCam0, calibCam1, calibCam2, calibCam3], 
      vs, 
      fs,)
    // const positionBuffer = BufferInitialization.init(gl, extractArray.positions, gl.ARRAY_BUFFER);
    // let calib0Buffer = BufferInitialization.init(gl, calibCam0, gl.ARRAY_BUFFER);
    // let calib1Buffer = BufferInitialization.init(gl, calibCam1, gl.ARRAY_BUFFER);
    // let calib2Buffer = BufferInitialization.init(gl, calibCam2, gl.ARRAY_BUFFER);
    // let calib3Buffer = BufferInitialization.init(gl, calibCam3, gl.ARRAY_BUFFER);
    // let cutTexCam0 = BufferInitialization.init(gl, repeat(parseInt(calibCam0.length/2),[0,0.5]), gl.ARRAY_BUFFER);
    // let cutTexCam1 = BufferInitialization.init(gl, repeat(parseInt(calibCam1.length/2),[0.5,0.5]), gl.ARRAY_BUFFER);
    // let cutTexCam2 = BufferInitialization.init(gl, repeat(parseInt(calibCam2.length/2),[0,0]), gl.ARRAY_BUFFER);
    // let cutTexCam3 = BufferInitialization.init(gl, repeat(parseInt(calibCam3.length/2),[0.5,0]), gl.ARRAY_BUFFER);

    // const texUniformLocation = gl.getUniformLocation(program, "u_image");
    // const alphaUniformLocation = gl.getUniformLocation(program, "u_alpha");

    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // function getExtents(positions) {
    //     const min = positions.slice(0, 3);
    //     const max = positions.slice(0, 3);
    //     for (let i = 3; i < positions.length; i += 3) {
    //     for (let j = 0; j < 3; ++j) {
    //         const v = positions[i + j];
    //         min[j] = Math.min(v, min[j]);
    //         max[j] = Math.max(v, max[j]);
    //     }
    //     }
    //     return {min, max};
    // }

    // function getGeometriesExtents(geometries) {
    //     return geometries.reduce(({min, max}, data) => {
    //     const minMax = getExtents(data.positions);
    //     return {
    //         min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
    //         max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
    //     };
    //     }, {
    //     min: Array(3).fill(Number.POSITIVE_INFINITY),
    //     max: Array(3).fill(Number.NEGATIVE_INFINITY),
    //     });
    // }

    // const extents = getGeometriesExtents([extractArray]);
    // const range = vec3.create()
    // vec3.sub(range, vec3.fromValues(...extents.max), vec3.fromValues(...extents.min))
    // //   const range = m4.subtractVectors(extents.max, extents.min);
    
    // // amount to move the object so its center is at the origin
    
    // const objOffset = vec3.create();
    // vec3.scale(objOffset, range, 0.5);
    // vec3.add(objOffset, objOffset, vec3.fromValues(...extents.min));
    // vec3.scale(objOffset, objOffset, -1);

    // const cameraTarget = vec3.fromValues(...[0, 0, 0]);
    
    // const radius = vec3.length(range)*0.3;

    // const cameraPosition = vec3.create();
    // vec3.add(cameraPosition, cameraTarget, vec3.fromValues(...[0, deg2Rad(90), radius]));

    // const zNear = radius / 100;
    // const zFar = radius * 4;

  
    // function handleMatrix(rotation) {
    //     const fieldOfViewRadians = deg2Rad(90);
    //     const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    //     const projection = mat4.create()
    //     mat4.perspective(projection, fieldOfViewRadians, aspect, zNear, zFar)
    //     const up = [0, 1, 0];
        
    //     const camera = mat4.create()
        
    //     mat4.rotateY(camera, camera, deg2Rad(rotation[1]))
    //     mat4.rotateX(camera, camera, deg2Rad(rotation[0]))
    //     mat4.translate(camera, camera, [0, 0, radius])
    //     const cameraPosition2 = vec3.fromValues(camera[12], camera[13], camera[14])
        
    //     mat4.targetTo(camera, cameraPosition2, cameraTarget, vec3.fromValues(...up));
    //     // vec3.translate(cameraPosition, 0, 0, radius)
    //     const view = mat4.create();
    //     mat4.invert(view, camera);

    //     const uniformLocation = {
    //         u_view: gl.getUniformLocation(program, 'u_view'),
    //         u_projection: gl.getUniformLocation(program, 'u_projection'),
    //         u_world: gl.getUniformLocation(program, 'u_world'),
    //     }
    //     gl.useProgram(program);
    
    //     gl.uniformMatrix4fv(uniformLocation.u_view, false, view);
    //     gl.uniformMatrix4fv(uniformLocation.u_projection, false, projection);
    
    //     const u_world = mat4.create();

    //     // mat4.rotateZ(u_world, u_world, rotation[2]);
    //     // mat4.rotateY(u_world, u_world, rotation[1]);
    //     // mat4.rotateX(u_world, u_world, rotation[0]);
    //     // mat4.rotateX(u_world, u_world, deg2Rad(90));
    //     mat4.translate(u_world, u_world, objOffset);
    //     gl.uniformMatrix4fv(uniformLocation.u_world, false, u_world);
    
    // }
    // function enableAttrib () {
    //     const positionLocation = gl.getAttribLocation(program, `a_position`)
    //     gl.enableVertexAttribArray(positionLocation);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    //     gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0 ,0);
    //     // gl.drawArrays(gl.TRIANGLES, 0, extractArray.positions.length/3);
    // }
    // function enableAttribTex(texture, alphaTexture, calibBuffer, cutTexBuffer) {
    //     let texLocation = gl.getAttribLocation(program, `texCoord`)
    //     gl.bindBuffer(gl.ARRAY_BUFFER, calibBuffer)
    //     gl.enableVertexAttribArray(texLocation);
    //     gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 0 ,0);
    //     let cutTexLocation = gl.getAttribLocation(program, `cutTexCoord`);
    //     gl.bindBuffer(gl.ARRAY_BUFFER, cutTexBuffer);
    //     gl.enableVertexAttribArray(cutTexLocation);
    //     gl.vertexAttribPointer(cutTexLocation, 2, gl.FLOAT, false, 0 ,0);
    //     // Texture 0
    //     gl.activeTexture(gl.TEXTURE0);
    //     gl.bindTexture(gl.TEXTURE_2D, texture);
    //     gl.uniform1i(texUniformLocation, 0);
    
    //     gl.activeTexture(gl.TEXTURE1);
    //     gl.bindTexture(gl.TEXTURE_2D, alphaTexture);
    //     gl.uniform1i(alphaUniformLocation, 1);
    // }
    // let texture0 = loadTexture(gl, video);
    // let texturealpha0 = loadTexture(gl, alphas[0]);
    // let texturealpha1 = loadTexture(gl, alphas[1]);
    // let texturealpha2 = loadTexture(gl, alphas[2]);
    // let texturealpha3 = loadTexture(gl, alphas[3]);
    let fps = 25;
    function render() {
        svm.render(
          [0,90,0],
          90
        )
        // gl.enable(gl.CULL_FACE)
        // gl.enable(gl.DEPTH_TEST);

        // handleMatrix([0, 150, 0]);
        // enableAttrib()

        // texture0 = updateTexture(gl, texture0, video);
        // // CAM 0, 3;
        // enableAttribTex(texture0, texturealpha0, calib0Buffer, cutTexCam0);

        // gl.drawArrays(gl.TRIANGLES, 0, extractArray.positions.length/3);
        
        // enableAttribTex(texture0, texturealpha3, calib3Buffer, cutTexCam3);
        
        // gl.drawArrays(gl.TRIANGLES, 0, extractArray.positions.length/3);
        
        // // CAM 1, 2
        
        // enableAttribTex(texture0, texturealpha1, calib1Buffer, cutTexCam1);

        // gl.drawArrays(gl.TRIANGLES, 0, extractArray.positions.length/3);
        
        // enableAttribTex(texture0, texturealpha2, calib2Buffer, cutTexCam2);

        // gl.drawArrays(gl.TRIANGLES, 0, extractArray.positions.length/3);

       

        setTimeout(() => {
            requestAnimationFrame(render);
          }, 1000 / fps);
    }
    requestAnimationFrame(render);
}

loadVideoAndImages("video/video_in.mp4", ['obj/scalib/alpha_0.png', 'obj/scalib/alpha_1.png', 'obj/scalib/alpha_2.png', 'obj/scalib/alpha_3.png'], main)


class SurroundingViewLoading {
  constructor (gl, canvas, video, alphas, parseObj, calibCam, vs, fs, radiusFactor=0.3) {
    this.canvas = canvas;
    this.gl = gl;
    this.video = video;
    this.texture = this.loadTexture(this.video);
    this.texturealpha0 = this.loadTexture(alphas[0]);
    this.texturealpha1 = this.loadTexture(alphas[1]);
    this.texturealpha2 = this.loadTexture(alphas[2]);
    this.texturealpha3 = this.loadTexture(alphas[3]);
    // this.alphas = alphas;
    this.program = new Shader(gl).createProgram(vs, fs);
    this.parseObj = parseObj
    this.setup(calibCam, radiusFactor)
  }
  setup(calibCam, radiusFactor) {
    this.texUniformLocation = this.gl.getUniformLocation(this.program, "u_image");
    this.alphaUniformLocation = this.gl.getUniformLocation(this.program, "u_alpha");

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.positionBuffer = BufferInitialization.init(this.gl, this.parseObj.positions, this.gl.ARRAY_BUFFER);
    this.calib0Buffer = BufferInitialization.init(this.gl, calibCam[0], this.gl.ARRAY_BUFFER);
    this.calib1Buffer = BufferInitialization.init(this.gl, calibCam[1], this.gl.ARRAY_BUFFER);
    this.calib2Buffer = BufferInitialization.init(this.gl, calibCam[2], this.gl.ARRAY_BUFFER);
    this.calib3Buffer = BufferInitialization.init(this.gl, calibCam[3], this.gl.ARRAY_BUFFER);
    this.cutTexCam0 = BufferInitialization.init(this.gl, repeat(parseInt(calibCam[0].length/2),[0,0.5]), this.gl.ARRAY_BUFFER);
    this.cutTexCam1 = BufferInitialization.init(this.gl, repeat(parseInt(calibCam[1].length/2),[0.5,0.5]), this.gl.ARRAY_BUFFER);
    this.cutTexCam2 = BufferInitialization.init(this.gl, repeat(parseInt(calibCam[2].length/2),[0,0]), this.gl.ARRAY_BUFFER);
    this.cutTexCam3 = BufferInitialization.init(this.gl, repeat(parseInt(calibCam[3].length/2),[0.5,0]), this.gl.ARRAY_BUFFER);

    this.extents = this.getGeometriesExtents([this.parseObj]);
    this.range = vec3.create()
    vec3.sub(this.range, vec3.fromValues(...this.extents.max), vec3.fromValues(...this.extents.min))
    //   const range = m4.subtractVectors(extents.max, extents.min);
    
    // amount to move the object so its center is at the origin
    
    this.objOffset = vec3.create();
    vec3.scale(this.objOffset, this.range, 0.5);
    vec3.add(this.objOffset, this.objOffset, vec3.fromValues(...this.extents.min));
    vec3.scale(this.objOffset, this.objOffset, -1);

    this.cameraTarget = vec3.fromValues(...[0, 0, 0]);
    
    this.radius = vec3.length(this.range)*radiusFactor;

    // const cameraPosition = vec3.create();
    // vec3.add(cameraPosition, cameraTarget, vec3.fromValues(...[0, deg2Rad(90), radius]));

    

 
  }
  computeMatrix(rotation, fieldOfViewDegrees=90) {
    const zNear = this.radius / 100;
    const zFar = this.radius * 4;
    const fieldOfViewRadians = deg2Rad(fieldOfViewDegrees);
    const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    const projection = mat4.create()
    mat4.perspective(projection, fieldOfViewRadians, aspect, zNear, zFar)
    const up = [0, 1, 0];
    
    const camera = mat4.create()
    
    mat4.rotateY(camera, camera, deg2Rad(rotation[1]))
    mat4.rotateX(camera, camera, deg2Rad(rotation[0]))
    mat4.translate(camera, camera, [0, 0, this.radius])
    const cameraPosition = vec3.fromValues(camera[12], camera[13], camera[14])
    
    mat4.targetTo(camera, cameraPosition, this.cameraTarget, vec3.fromValues(...up));
    // vec3.translate(cameraPosition, 0, 0, radius)
    const view = mat4.create();
    mat4.invert(view, camera);

    const uniformLocation = {
        u_view: this.gl.getUniformLocation(this.program, 'u_view'),
        u_projection: this.gl.getUniformLocation(this.program, 'u_projection'),
        u_world: this.gl.getUniformLocation(this.program, 'u_world'),
    }
    this.gl.useProgram(this.program);

    this.gl.uniformMatrix4fv(uniformLocation.u_view, false, view);
    this.gl.uniformMatrix4fv(uniformLocation.u_projection, false, projection);

    const u_world = mat4.create();

    // mat4.rotateZ(u_world, u_world, rotation[2]);
    // mat4.rotateY(u_world, u_world, rotation[1]);
    // mat4.rotateX(u_world, u_world, rotation[0]);
    // mat4.rotateX(u_world, u_world, deg2Rad(90));
    mat4.translate(u_world, u_world, this.objOffset);
    this.gl.uniformMatrix4fv(uniformLocation.u_world, false, u_world);

  }
  getExtents(positions) {
    const min = positions.slice(0, 3);
    const max = positions.slice(0, 3);
    for (let i = 3; i < positions.length; i += 3) {
    for (let j = 0; j < 3; ++j) {
        const v = positions[i + j];
        min[j] = Math.min(v, min[j]);
        max[j] = Math.max(v, max[j]);
    }
    }
    return {min, max};
  }

  getGeometriesExtents(geometries) {
    return geometries.reduce(({min, max}, data) => {
    const minMax = this.getExtents(data.positions);
    return {
        min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
        max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
    };
    }, {
    min: Array(3).fill(Number.POSITIVE_INFINITY),
    max: Array(3).fill(Number.NEGATIVE_INFINITY),
    });
  }
  enableAttribLocation () {
    const positionLocation = this.gl.getAttribLocation(this.program, `a_position`)
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
    this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0 ,0);
  }
  enableAttribTex(texture, alphaTexture, calibBuffer, cutTexBuffer) {
    let texLocation = this.gl.getAttribLocation(this.program, `texCoord`)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, calibBuffer)
    this.gl.enableVertexAttribArray(texLocation);
    this.gl.vertexAttribPointer(texLocation, 2, this.gl.FLOAT, false, 0 ,0);
    let cutTexLocation = this.gl.getAttribLocation(this.program, `cutTexCoord`);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, cutTexBuffer);
    this.gl.enableVertexAttribArray(cutTexLocation);
    this.gl.vertexAttribPointer(cutTexLocation, 2, this.gl.FLOAT, false, 0 ,0);
    // Texture 0
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.uniform1i(this.texUniformLocation, 0);

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, alphaTexture);
    this.gl.uniform1i(this.alphaUniformLocation, 1);
  }
  loadTexture(image) {
    const texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    const level = 0;
    const internalFormat = this.gl.RGBA;
    const srcFormat = this.gl.RGBA;
    const srcType = this.gl.UNSIGNED_BYTE;

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(
    this.gl.TEXTURE_2D,
    level,
    internalFormat,
    srcFormat,
    srcType,
    image
    );
     
  

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    
    return texture;
  }
  updateTexture(image) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    const level = 0;
    const internalFormat = this.gl.RGBA;
    const srcFormat = this.gl.RGBA;
    const srcType = this.gl.UNSIGNED_BYTE;
  
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texImage2D(
    this.gl.TEXTURE_2D,
    level,
    internalFormat,
    srcFormat,
    srcType,
    image
    );
  
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    
    return texture;
  
  }
  render(rotation, fielOfView) {
    this.computeMatrix(rotation, fielOfView)
    this.enableAttribLocation()

    this.texture = updateTexture(this.gl, this.texture, this.video);
    // CAM 0, 3;
    this.enableAttribTex(this.texture, this.texturealpha0, this.calib0Buffer, this.cutTexCam0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.parseObj.positions.length/3);
    
    this.enableAttribTex(this.texture, this.texturealpha3, this.calib3Buffer, this.cutTexCam3);
    
    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.parseObj.positions.length/3);
    
    // CAM 1, 2
    
    this.enableAttribTex(this.texture, this.texturealpha1, this.calib1Buffer, this.cutTexCam1);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.parseObj.positions.length/3);
    
    this.enableAttribTex(this.texture, this.texturealpha2, this.calib2Buffer, this.cutTexCam2);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.parseObj.positions.length/3);

  }

}