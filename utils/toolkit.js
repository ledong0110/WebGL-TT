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