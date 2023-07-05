function deg2Rad(d) {
    return d * Math.PI / 180;
}





class Shader {
    static #vertexCode;
    static #fragmentCode;
    static setCode (vertex, fragment){
        Shader.vertexCode = vertex;
        Shader.fragmentCode = fragment;
    }
    constructor(gl) {
        this.gl = gl;
    }

    createProgram(vs, fs) {
        if (!vs) vs = Shader.vertexCode;
        if (!fs) fs = Shader.fragmentCode
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, vs);
        this.gl.compileShader(vertexShader);

        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, fs);
        this.gl.compileShader(fragmentShader);

        const program = this.gl.createProgram()
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        
        return program;
    }
}

class BufferInitialization {
    static init(gl, coord, typeBuffer) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(typeBuffer, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coord), gl.STATIC_DRAW);
        return buffer
    }
}

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
function loadVideoAndImages(urls, alphaurls, carImg, alphaTV, icons, callback) {
    var videoLoad;
    var carLoad;
    var alphas = [];
    var alphaTVs = [];
    var iconList = [];
    var imagesAndVideosToLoad =alphaurls.length + alphaTV.length + icons.length +2;
    // Called each time an image finished loading.
    var onVideoLoad = function() {
      --imagesAndVideosToLoad;
      console.log(imagesAndVideosToLoad)
      // If all the images are loaded call the callback.
      if (imagesAndVideosToLoad == 0) {
        console.log("Loaded")
        callback(videoLoad, alphas, carLoad, alphaTVs, iconList);
      }
    };
   
    videoLoad = loadVideo(urls, onVideoLoad);
  
    for (var ii = 0; ii < alphaurls.length; ++ii) {
      var alpha = loadImage(alphaurls[ii], onVideoLoad);
      alphas.push(alpha);
    }

    for (var ii = 0; ii < alphaTV.length; ++ii) {
        var alpha = loadImage(alphaTV[ii], onVideoLoad);
        alphaTVs.push(alpha);
      }
    for (var ii = 0; ii < icons.length; ++ii) {
      var icon = loadImage(icons[ii], onVideoLoad);
      iconList.push(icon);
    }
    carLoad = loadImage(carImg, onVideoLoad);
   
}

function repeat(n, pattern) {
    let array = []
    for (let i = 0; i < n; i++)
        array.push(...pattern)
    return array;
}

class TopViewLoading {
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
    // this.radius = 7
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
    
    // const radius = 7;
    // const pitch = 33.5;
    // const yawl = -65;
    // let x = radius * Math.cos(deg2Rad(yawl)) * Math.cos(deg2Rad(pitch));
    // let y = radius * Math.sin(deg2Rad(pitch));
    // let z = radius * Math.sin(deg2Rad(yawl)) * Math.cos(deg2Rad(pitch));


    // const cameraPosition = vec3.fromValues(x, y, z);


    const camera = mat4.create()
    mat4.rotateZ(camera, camera, deg2Rad(rotation[2]))
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
    mat4.translate(u_world, u_world, [this.objOffset[0], this.objOffset[1]*0.6, this.objOffset[2]]);
    
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
    
    // return this.texture;
  
  }
  render(rotation, fielOfView) {
    this.gl.enable(this.gl.BLEND);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.computeMatrix(rotation, fielOfView);
    this.enableAttribLocation();

    this.updateTexture(this.video);
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
    
    this.gl.disable(this.gl.BLEND);
  }

}

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
    
    // this.radius = vec3.length(this.range)*radiusFactor;
    this.radius = 7
    // const cameraPosition = vec3.create();
    // vec3.add(cameraPosition, cameraTarget, vec3.fromValues(...[0, deg2Rad(90), radius]));

    

 
  }
  computeMatrix(rotation, fieldOfViewDegrees=90) {
    // const zNear = this.radius / 100;
    // const zFar = this.radius * 4;
    const zNear = 0.01;
    const zFar = 100;
    const fieldOfViewRadians = deg2Rad(fieldOfViewDegrees);
    const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    const projection = mat4.create()
    mat4.perspective(projection, fieldOfViewRadians, aspect, zNear, zFar)
    const up = [0, 1, 0];
    let x,y,z;
   
    const radius = 7;
    const pitch = 33.5;
    const yawl = -65;
    x = radius * Math.cos(deg2Rad(yawl)) * Math.cos(deg2Rad(pitch));
    y = radius * Math.sin(deg2Rad(pitch));
    z = radius * Math.sin(deg2Rad(yawl)) * Math.cos(deg2Rad(pitch));
   

    // const cameraPosition = vec3.fromValues(x, y, z);


    const camera = mat4.create()
    mat4.rotateZ(camera, camera, deg2Rad(rotation[2]))
    mat4.rotateY(camera, camera, deg2Rad(rotation[1]))
    mat4.rotateX(camera, camera, deg2Rad(rotation[0]))
    mat4.translate(camera, camera, [x, y, z])
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
    mat4.translate(u_world, u_world, [this.objOffset[0], this.objOffset[1]*0.6, this.objOffset[2]]);
    
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
    
    // return this.texture;
  
  }
  render(rotation, fielOfView) {
    this.gl.enable(this.gl.BLEND);
    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    this.computeMatrix(rotation, fielOfView);
    this.enableAttribLocation();

    this.updateTexture(this.video);
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
    
    this.gl.disable(this.gl.BLEND);
  }

}

class CarViewLoading {
    constructor (gl, canvas, carTex, parseObj, vs, fs,  radiusFactor=0.6, mode='surrounding') {
      this.canvas = canvas;
      this.gl = gl;
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
      this.texture = this.loadTexture(carTex);
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 0);
      this.program = new Shader(gl).createProgram(vs, fs);
      this.parseObj = parseObj
      this.mode = mode;
      this.setup(radiusFactor)
    }
    setup(radiusFactor) {
       
        this.positionBuffer = BufferInitialization.init(this.gl, this.parseObj.positions, this.gl.ARRAY_BUFFER);
        this.texBuffer = BufferInitialization.init(this.gl, this.parseObj.texCoord, this.gl.ARRAY_BUFFER);
        
        this.texUniformLocation = this.gl.getUniformLocation(this.program, "u_image");
        
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
        
        // this.radius = vec3.length(this.range)*radiusFactor;
        this.radius = 7;
      // const cameraPosition = vec3.create();
      // vec3.add(cameraPosition, cameraTarget, vec3.fromValues(...[0, deg2Rad(90), radius]));
  
      
  
   
    }
    computeMatrix(rotation, fieldOfViewDegrees=90) {
    //   const zNear = this.radius / 100;
    //   const zFar = this.radius * 4;
      const zNear = 0.1;
      const zFar = 100;
      const fieldOfViewRadians = deg2Rad(fieldOfViewDegrees);
      const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
      const projection = mat4.create()
      mat4.perspective(projection, fieldOfViewRadians, aspect, zNear, zFar)
      const up = [0, 1, 0];

      // const radius = 7;
      // const pitch = 33.5;
      // const yawl = -65;
      // let x = radius * Math.cos(deg2Rad(yawl)) * Math.cos(deg2Rad(pitch));
      // let y = radius * Math.sin(deg2Rad(pitch));
      // let z = radius * Math.sin(deg2Rad(yawl)) * Math.cos(deg2Rad(pitch));
      let x,y,z;
      if (this.mode == 'surrounding'){
        const radius = 7;
        const pitch = 33.5;
        const yawl = -65;
        x = radius * Math.cos(deg2Rad(yawl)) * Math.cos(deg2Rad(pitch));
        y = radius * Math.sin(deg2Rad(pitch));
        z = radius * Math.sin(deg2Rad(yawl)) * Math.cos(deg2Rad(pitch));
      }
      else {
        x = 0;
        y = 0;
        z = this.radius;
      }


      const camera = mat4.create()
      mat4.rotateZ(camera, camera, deg2Rad(rotation[2]))
      mat4.rotateY(camera, camera, deg2Rad(rotation[1]))
      mat4.rotateX(camera, camera, deg2Rad(rotation[0]))
      mat4.translate(camera, camera, [x, y, z])
      const cameraPosition = vec3.fromValues(camera[12], camera[13], camera[14])
    //   const cameraPosition = vec3.fromValues(x, y, z);
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
  
    //   mat4.rotateZ(u_world, u_world, rotation[2]);
      mat4.rotateY(u_world, u_world, deg2Rad(90));
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
    enableAttribTex(texture, texBuffer) {
      const texLocation = this.gl.getAttribLocation(this.program, `texCoord`)
      this.gl.enableVertexAttribArray(texLocation);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texBuffer)
      this.gl.vertexAttribPointer(texLocation, 2, this.gl.FLOAT, false, 0 ,0);
      // Texture 0
      this.gl.activeTexture(this.gl.TEXTURE0);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
      this.gl.uniform1i(this.texUniformLocation, 0);
  
    
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
    
    render(rotation, fielOfView) {
        // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
      this.gl.enable(this.gl.DEPTH_TEST);
      this.computeMatrix(rotation, fielOfView);
    
  
      this.enableAttribLocation();
      this.enableAttribTex(this.texture, this.texBuffer);
  
      
  
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.parseObj.positions.length/3);
      
     
    //   this.gl.disable(this.gl.DEPTH_TEST);
    //   this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 0);
    }
  
  }
