class Button{
    static #vs = `
        attribute vec4 a_position;
        attribute vec2 texCoord;



        uniform mat4 u_projection;
        uniform mat4 u_view;
        uniform mat4 u_world;

        varying vec2 v_texCoord;


        void main() {
            gl_Position =  u_world * a_position;
            v_texCoord = texCoord;

        }
    `;
    static #fs = `
    precision mediump float;

    uniform sampler2D u_image;


    varying vec2 v_texCoord;


    void main () {
        gl_FragColor = vec4(texture2D(u_image,  v_texCoord));
        // gl_FragColor = vec4(0,0,0,1);
    }
    `;
    constructor (gl, canvas, buttonTex, radiusFactor=1) {
      this.canvas = canvas;
      this.gl = gl;
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
      this.texture = this.loadTexture(buttonTex);
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 0);
     
      this.program = new Shader(gl).createProgram(Button.#vs, Button.#fs);
      this.parseObj = {
        positions:[
            -1, 1, 0,
            -1, -1, 0,
            1, 1, 0,
            -1,-1, 0,
            1, -1, 0,
            1, 1, 0,
        ],
        texCoord: [
            0.0,  1.0,
            0.0,  0.0,
            1.0,  1.0,
            0.0,  0.0,
            1.0,  0.0,
            1.0,  1.0,
        ]
      }
      this.setup(radiusFactor)
    }
    setup() {
       
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
    computeMatrix(scale, translation, rotation, fieldOfViewDegrees=90) {
      const zNear = this.radius / 100;
      const zFar = this.radius * 4;
    //   const zNear = 0.1;
    //   const zFar = 100;
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
      


      const camera = mat4.create()
      mat4.rotateZ(camera, camera, deg2Rad(rotation[2]))
      mat4.rotateY(camera, camera, deg2Rad(rotation[1]))
      mat4.rotateX(camera, camera, deg2Rad(rotation[0]))
      mat4.translate(camera, camera, [0,0,this.radius])
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
      mat4.scale(u_world, u_world, scale);
    //   mat4.rotateZ(u_world, u_world, rotation[2]);
    //   mat4.rotateY(u_world, u_world, deg2Rad(90));
      // mat4.rotateX(u_world, u_world, rotation[0]);
      // mat4.rotateX(u_world, u_world, deg2Rad(90));
      mat4.translate(u_world, u_world, this.objOffset);
      mat4.translate(u_world, u_world, translation)
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
    
    render(scale, translation, rotation, fielOfView) {
        // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
        this.gl.enable(this.gl.BLEND);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.blendFunc(this.gl.MINUS_SRC_ALPHA, this.gl.SRC_ALPHA);

        this.computeMatrix(scale, translation, rotation, fielOfView);
    
  
      this.enableAttribLocation();
      this.enableAttribTex(this.texture, this.texBuffer);
  
      
  
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.parseObj.positions.length/3);
      
     
    //   this.gl.disable(this.gl.DEPTH_TEST);
    //   this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 0);
    }
  
  }



  class LoadScene{
    static #vs = `
    attribute vec4 a_position;
    attribute vec2 texCoord;
    attribute vec2 cutTexCoord;


    uniform mat4 u_projection;
    uniform mat4 u_view;
    uniform mat4 u_world;

    varying vec2 v_texCoord;
    varying vec2 v_cutTexCoord;
    varying vec4 v_color;

    void main() {
      gl_Position = u_projection * u_view * u_world * a_position;
      v_texCoord = texCoord;
      v_cutTexCoord = cutTexCoord;
    }
    `;
    static #fs = `
    precision mediump float;

    uniform sampler2D u_image;
   
    
    varying vec2 v_texCoord;
    varying vec2 v_cutTexCoord;
    
    void main () {
      if (v_texCoord.x > 0. && v_texCoord.x < 1. && v_texCoord.y > 0. && v_texCoord.y < 1.){
          vec2 calTexCoord = v_texCoord*vec2(1,-1) + vec2(0,1);
          vec4 vTexture = texture2D(u_image, (calTexCoord)/2.+v_cutTexCoord);
        
          
          gl_FragColor =  vTexture;
          // gl_FragColor =  vec4(0,0,0,1);
      }
      else {
          
          discard;
      }
      // gl_FragColor = vec4(0,1,0,1);
    }
    `;
    constructor (gl, canvas, video, meshPositions, meshUVs, radiusFactor=0.3) {
      this.canvas = canvas;
      this.gl = gl;
      this.video = video;
      this.texture = this.loadTexture(this.video);
      
      // this.alphas = alphas;
      this.program = new Shader(gl).createProgram(LoadScene.#vs, LoadScene.#fs);
      this.parseObj = {
        geometries: meshPositions.map((positions) => ({positions})),
        texCoord: meshUVs,
      }
      this.setup(radiusFactor)
    }
    setup(radiusFactor) {
      this.mapping = {
        "front": 1,
        "left": 0,
        "right": 3,
        "rear": 2,
      }
      this.texUniformLocation = this.gl.getUniformLocation(this.program, "u_image");
      
      this.positionBuffers = this.parseObj.geometries.map((pos) => BufferInitialization.init(this.gl, pos.positions, this.gl.ARRAY_BUFFER));
      this.texBuffers = this.parseObj.texCoord.map((texCoord) => BufferInitialization.init(this.gl, texCoord, this.gl.ARRAY_BUFFER));
      this.cutTexCam = []
      this.cutTexCam.push(BufferInitialization.init(this.gl, repeat(parseInt(this.parseObj.texCoord[0].length/2),[0,0.5]), this.gl.ARRAY_BUFFER));
      this.cutTexCam.push(BufferInitialization.init(this.gl, repeat(parseInt(this.parseObj.texCoord[1].length/2),[0.5,0.5]), this.gl.ARRAY_BUFFER));
      this.cutTexCam.push(BufferInitialization.init(this.gl, repeat(parseInt(this.parseObj.texCoord[2].length/2),[0,0]), this.gl.ARRAY_BUFFER));
      this.cutTexCam.push(BufferInitialization.init(this.gl, repeat(parseInt(this.parseObj.texCoord[3].length/2),[0.5,0]), this.gl.ARRAY_BUFFER));

      this.extents = this.getGeometriesExtents(this.parseObj.geometries);
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
      
      const radius = 5;
      const pitch = 0;
      const yawl = 0;
      let x = radius * Math.cos(deg2Rad(yawl)) * Math.cos(deg2Rad(pitch));
      let y = radius * Math.sin(deg2Rad(pitch));
      let z = radius * Math.sin(deg2Rad(yawl)) * Math.cos(deg2Rad(pitch));
  
  
  
      // const cameraPosition = vec3.fromValues(x, y, z);
  
  
      const camera = mat4.create()
      mat4.rotateZ(camera, camera, deg2Rad(rotation[2]))
      mat4.rotateY(camera, camera, deg2Rad(rotation[1]))
      mat4.rotateX(camera, camera, deg2Rad(rotation[0]))
      // mat4.translate(camera, camera, [0, 0, this.radius])
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
      mat4.rotateX(u_world, u_world, deg2Rad(-90));
      // mat4.translate(u_world, u_world, [this.objOffset[0], this.objOffset[1]*0.6, this.objOffset[2]]);
      
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
    enableAttribLocation (idx) {
      const positionLocation = this.gl.getAttribLocation(this.program, `a_position`)
      this.gl.enableVertexAttribArray(positionLocation);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffers[idx])
      this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0 ,0);
    }
    enableAttribTex(texture, calibBuffer, cutTexBuffer) {
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
    render(rotation, fielOfView, mode) {
      // this.gl.enable(this.gl.BLEND);
      // this.gl.disable(this.gl.DEPTH_TEST);
      // this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      
      this.computeMatrix(rotation, fielOfView);
      
      this.updateTexture(this.video);
      // CAM 0, 3;
      this.enableAttribLocation(this.mapping[mode]);

      this.enableAttribTex(this.texture, this.texBuffers[this.mapping[mode]], this.cutTexCam[this.mapping[mode]]);
  
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.parseObj.geometries[this.mapping[mode]].positions.length/3);
      
      // this.gl.disable(this.gl.BLEND);
    }
  
  }


  class LoadSceneTire{
    static #vs = `
    attribute vec4 a_position;
    attribute vec2 texCoord;
    attribute vec2 cutTexCoord;


    uniform mat4 u_projection;
    uniform mat4 u_view;
    uniform mat4 u_world;

    varying vec2 v_texCoord;
    varying vec2 v_cutTexCoord;
    varying vec4 v_color;

    void main() {
      gl_Position = u_projection * u_view * u_world * a_position;
      v_texCoord = texCoord;
      v_cutTexCoord = cutTexCoord;
    }
    `;
    static #fs = `
    precision mediump float;

    uniform sampler2D u_image;
   
    
    varying vec2 v_texCoord;
    varying vec2 v_cutTexCoord;
    
    void main () {
      if (v_texCoord.x > 0. && v_texCoord.x < 1. && v_texCoord.y > 0. && v_texCoord.y < 1.){
          vec2 calTexCoord = v_texCoord*vec2(1,-1) + vec2(0,1);
          vec4 vTexture = texture2D(u_image, (calTexCoord)/2.+v_cutTexCoord);
        
          
          gl_FragColor =  vTexture;
          // gl_FragColor =  vec4(0,0,0,1);
      }
      else {
          
          discard;
      }
      // gl_FragColor = vec4(0,1,0,1);
    }
    `;
    constructor (gl, canvas, video, meshPositions, meshUVs, radiusFactor=0.3) {
      this.canvas = canvas;
      this.gl = gl;
      this.video = video;
      this.texture = this.loadTexture(this.video);
      
      // this.alphas = alphas;
      this.program = new Shader(gl).createProgram(LoadSceneTire.#vs, LoadSceneTire.#fs);
      this.parseObj = {
        geometries: meshPositions.map((positions) => ({positions})),
        texCoord: meshUVs,
      }
      this.setup(radiusFactor)
    }
    setup(radiusFactor) {
      this.mapping = {
        "front": 0,
        "rear": 2,
      }
      this.texUniformLocation = this.gl.getUniformLocation(this.program, "u_image");
      
      this.positionBuffers = this.parseObj.geometries.map((pos) => BufferInitialization.init(this.gl, pos.positions, this.gl.ARRAY_BUFFER));
     
      this.texBuffers = this.parseObj.texCoord.map((texCoord) => BufferInitialization.init(this.gl, texCoord, this.gl.ARRAY_BUFFER));
      this.cutTexCam = []
      this.cutTexCam.push(BufferInitialization.init(this.gl, repeat(parseInt(this.parseObj.texCoord[0].length/2),[0,0.5]), this.gl.ARRAY_BUFFER));
      // this.cutTexCam.push(BufferInitialization.init(this.gl, repeat(parseInt(this.parseObj.texCoord[0].length/2),[0.5,0.5]), this.gl.ARRAY_BUFFER));
      // this.cutTexCam.push(BufferInitialization.init(this.gl, repeat(parseInt(this.parseObj.texCoord[0].length/2),[0,0]), this.gl.ARRAY_BUFFER));
      this.cutTexCam.push(BufferInitialization.init(this.gl, repeat(parseInt(this.parseObj.texCoord[1].length/2),[0.5,0]), this.gl.ARRAY_BUFFER));

      this.extents = this.getGeometriesExtents(this.parseObj.geometries);
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
      
      const radius = 5;
      const pitch = 0;
      const yawl = 0;
      let x = radius * Math.cos(deg2Rad(yawl)) * Math.cos(deg2Rad(pitch));
      let y = radius * Math.sin(deg2Rad(pitch));
      let z = radius * Math.sin(deg2Rad(yawl)) * Math.cos(deg2Rad(pitch));
  
  
      // const cameraPosition = vec3.fromValues(x, y, z);
  
  
      const camera = mat4.create()
      mat4.rotateZ(camera, camera, deg2Rad(rotation[2]))
      mat4.rotateY(camera, camera, deg2Rad(rotation[1]+180))
      mat4.rotateX(camera, camera, deg2Rad(rotation[0]))
      // mat4.translate(camera, camera, [0, 0, this.radius])
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
      mat4.rotateX(u_world, u_world, deg2Rad(-90));
      // mat4.translate(u_world, u_world, [this.objOffset[0], this.objOffset[1]*0.6, this.objOffset[2]]);
      
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
    enableAttribLocation (idx) {
      const positionLocation = this.gl.getAttribLocation(this.program, `a_position`)
      this.gl.enableVertexAttribArray(positionLocation);
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffers[idx])
      this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0 ,0);
    }
    enableAttribTex(texture, calibBuffer, cutTexBuffer) {
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
    render(rotation, fielOfView, mode) {
      this.gl.enable(this.gl.BLEND);
      this.gl.disable(this.gl.DEPTH_TEST);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      
      this.computeMatrix(rotation, fielOfView);
      this.updateTexture(this.video);
      
      this.enableAttribLocation(this.mapping[mode]);

      this.enableAttribTex(this.texture,  this.texBuffers[this.mapping[mode]], this.cutTexCam[0]);
  
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.parseObj.geometries[this.mapping[mode]].positions.length/3);

      this.enableAttribLocation(this.mapping[mode]+1);

      this.enableAttribTex(this.texture, this.texBuffers[this.mapping[mode]+1], this.cutTexCam[1]);
  
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.parseObj.geometries[this.mapping[mode]+1].positions.length/3);
      
      this.gl.disable(this.gl.BLEND);
    }
  
  }