function loadImage(url, callback) {
    var image = new Image();
    image.src = url;
    image.onload = () => callback(image);
    image.crossOrigin = 'anonymous';
    return image;
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



async function main(image) {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl", {  premultipliedAlpha: false});
    if (!gl) {
        return;
    }


    const vs = await (await fetch('shader/vertexShaderCar.glsl')).text()
    const fs = await (await fetch('shader/fragmentShaderCar.glsl')).text()
    const program = new Shader(gl).createProgram(vs, fs);
//   program = program;
    
    const response = await fetch('obj/E34_Body.obj');  
    const text = await response.text();
    
    const obj2 = parser(text)
    
    const visitor = new GLParseVisitor();
    // 0: postion 1: color 2: normals 3: texcoord
    let extractArray = visitor.visit(obj2)[0];


    const positionBuffer = BufferInitialization.init(gl, extractArray.positions, gl.ARRAY_BUFFER);
    const texBuffer = BufferInitialization.init(gl, extractArray.texCoord, gl.ARRAY_BUFFER);
    console.log(extractArray.texCoord)
    const texUniformLocation = gl.getUniformLocation(program, "u_image");

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    function getExtents(positions) {
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

    function getGeometriesExtents(geometries) {
        return geometries.reduce(({min, max}, data) => {
        const minMax = getExtents(data.positions);
        return {
            min: min.map((min, ndx) => Math.min(minMax.min[ndx], min)),
            max: max.map((max, ndx) => Math.max(minMax.max[ndx], max)),
        };
        }, {
        min: Array(3).fill(Number.POSITIVE_INFINITY),
        max: Array(3).fill(Number.NEGATIVE_INFINITY),
        });
    }

    const extents = getGeometriesExtents([extractArray]);
    const range = vec3.create()
    vec3.sub(range, vec3.fromValues(...extents.max), vec3.fromValues(...extents.min))
    //   const range = m4.subtractVectors(extents.max, extents.min);
    
    // amount to move the object so its center is at the origin
    
    const objOffset = vec3.create();
    vec3.scale(objOffset, range, 0.5);
    vec3.add(objOffset, objOffset, vec3.fromValues(...extents.min));
    vec3.scale(objOffset, objOffset, -1);

    const cameraTarget = vec3.fromValues(...[0, 0, 0]);
    
    const radius = vec3.length(range)*1.2;

    const cameraPosition = vec3.create();
    vec3.add(cameraPosition, cameraTarget, vec3.fromValues(...[0, deg2Rad(90), radius]));

    const zNear = radius / 100;
    const zFar = radius * 4;

  
    function handleMatrix(rotation) {
        const fieldOfViewRadians = deg2Rad(90);
        const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
        const projection = mat4.create()
        mat4.perspective(projection, fieldOfViewRadians, aspect, zNear, zFar)
        const up = [0, 1, 0];
        
        const camera = mat4.create()
        
        mat4.rotateY(camera, camera, deg2Rad(rotation[1]))
        mat4.rotateX(camera, camera, deg2Rad(rotation[0]))
        mat4.translate(camera, camera, [0, 0, radius])
        const cameraPosition2 = vec3.fromValues(camera[12], camera[13], camera[14])
        
        mat4.targetTo(camera, cameraPosition2, cameraTarget, vec3.fromValues(...up));
        // vec3.translate(cameraPosition, 0, 0, radius)
        const view = mat4.create();
        mat4.invert(view, camera);

        const uniformLocation = {
            u_view: gl.getUniformLocation(program, 'u_view'),
            u_projection: gl.getUniformLocation(program, 'u_projection'),
            u_world: gl.getUniformLocation(program, 'u_world'),
        }
        gl.useProgram(program);
    
        gl.uniformMatrix4fv(uniformLocation.u_view, false, view);
        gl.uniformMatrix4fv(uniformLocation.u_projection, false, projection);
    
        const u_world = mat4.create();

        // mat4.rotateZ(u_world, u_world, rotation[2]);
        // mat4.rotateY(u_world, u_world, rotation[1]);
        // mat4.rotateX(u_world, u_world, rotation[0]);
        // mat4.rotateX(u_world, u_world, deg2Rad(90));
        mat4.translate(u_world, u_world, objOffset);
        gl.uniformMatrix4fv(uniformLocation.u_world, false, u_world);
    
    }
    function enableAttrib () {
        const positionLocation = gl.getAttribLocation(program, `a_position`)
        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0 ,0);
        
    }
    function enableAttribTex(texture, texBuffer) {
        let texLocation = gl.getAttribLocation(program, `texCoord`)
        gl.enableVertexAttribArray(texLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer)
        gl.vertexAttribPointer(texLocation, 2, gl.FLOAT, false, 0 ,0);
       
        // Texture 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(texUniformLocation, 0);
    }
    let texture0 = loadTexture(gl, image);
    // console.log(image)
    let fps = 25;
    let time = 0.01
    console.log(extractArray)
    function render(time) {
      time *= 0.01
        // gl.enable(gl.CULL_FACE)
        gl.enable(gl.DEPTH_TEST);

        handleMatrix([0, time, 0]);
        enableAttrib()

        // texture0 = updateTexture(gl, texture0, video);
        // CAM 0, 3;
        enableAttribTex(texture0, texBuffer);

        gl.drawArrays(gl.TRIANGLES, 0, extractArray.positions.length/3);
        
       
       

        setTimeout(() => {
            requestAnimationFrame(render);
          }, 1000 / fps);
    }
    requestAnimationFrame(render);
}

loadImage("obj/E34_Tex_Luxury_Blue.bmp", main)
