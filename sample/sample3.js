const range = (start, end, step = 1) => {
    let output = [];
    if (typeof end === 'undefined') {
      end = start;
      start = 0;
    }
    for (let i = start; i < end; i += step) {
      output.push(i);
    }
    return output;
};
function deg2Rad(d) {
    return d * Math.PI / 180;
}

function detectOverlap(pt1, pt2) {
    // console.log(pt1)
    // console.log(pt2)
    if (pt1[0] <= pt2[2] && pt1[2] >= pt2[0] && pt1[1] > pt2[3] && pt1[3] < pt2[1])
        return true;
    return false;
}

function selectScaler(pointData1,pointData2, frontTranslation, leftTranslation, rightTranslation, rearTranslation, scaling) {
    var scaler = range(0,2,0.01);
 
    var frontPoint1 = vec4.fromValues(...pointData1, 0, 1);
    var frontPoint2 = vec4.fromValues(...pointData2, 0 , 1);
    var leftPoint1 = vec4.fromValues(...pointData1, 0, 1);
    var leftPoint2 = vec4.fromValues(...pointData2, 0, 1);
    var rightPoint1 = vec4.fromValues(...pointData1, 0, 1);
    var rightPoint2 = vec4.fromValues(...pointData2, 0, 1);
    var rearPoint1 = vec4.fromValues(...pointData1, 0, 1);
    var rearPoint2 = vec4.fromValues(...pointData2, 0, 1);

    var leftPointTmp1 = mat4.create()
    var leftPointTmp2 = mat4.create()

    var rightPointTmp1 = mat4.create()
    var rightPointTmp2 = mat4.create()

    var frontPointTmp1 = mat4.create()
    var frontPointTmp2 = mat4.create()

    var rearPointTmp1 = mat4.create()
    var rearPointTmp2 = mat4.create()
    var leftMatrix, frontMatrix, rearMatrix, rightMatrix;
    var returnSc = scaler[0];
    for (const sc of scaler) {
     
            leftMatrix = mat4.create()
            mat4.translate(leftMatrix, leftMatrix, [-1+sc*leftTranslation[0], leftTranslation[1],0]);
            mat4.scale(leftMatrix, leftMatrix, [sc*scaling[0], sc*scaling[1], 1]);
            mat4.rotateZ(leftMatrix, leftMatrix, deg2Rad(90));
            mat4.multiply(leftPointTmp1, leftMatrix, leftPoint1);
            mat4.multiply(leftPointTmp2, leftMatrix, leftPoint2);

            rightMatrix = mat4.create()
            mat4.translate(rightMatrix, rightMatrix, [1-sc*rightTranslation[0], rightTranslation[1],0]);
            mat4.scale(rightMatrix, rightMatrix, [sc*scaling[0], sc*scaling[1], 1]);
            mat4.rotateZ(rightMatrix, rightMatrix, deg2Rad(90));
            mat4.multiply(rightPointTmp1, rightMatrix, rightPoint1);
            mat4.multiply(rightPointTmp2, rightMatrix, rightPoint2);

            rearMatrix = mat4.create()
            mat4.translate(rearMatrix, rearMatrix, [rearTranslation[0], -1+sc*rearTranslation[1],0]);
            mat4.scale(rearMatrix, rearMatrix, [sc*scaling[0], sc*scaling[1], 1]);
            // mat4.rotateZ(rearMatrix, rearMatrix, deg2Rad(180));
            mat4.multiply(rearPointTmp1, rearMatrix, rearPoint1);
            mat4.multiply(rearPointTmp2, rearMatrix, rearPoint2);

            frontMatrix = mat4.create()
            mat4.translate(frontMatrix, frontMatrix, [frontTranslation[0], 1-sc*frontTranslation[1],0]);
            mat4.scale(frontMatrix, frontMatrix, [sc*scaling[0], sc*scaling[1], 1]);
            mat4.multiply(frontPointTmp1, frontMatrix, frontPoint1);
            mat4.multiply(frontPointTmp2, frontMatrix, frontPoint2);
            // console.log(frontPoint2)
            // console.log(frontMatrix)
            // console.log(frontPointTmp2)
            console.log(sc)
            if (
                detectOverlap([frontPointTmp1[0], frontPointTmp1[1], frontPointTmp2[0], frontPointTmp2[1]], [leftPointTmp1[0], -leftPointTmp1[1], leftPointTmp2[0], -leftPointTmp2[1]]) || 
                detectOverlap([frontPointTmp1[0], frontPointTmp1[1], frontPointTmp2[0], frontPointTmp2[1]], [rearPointTmp1[0], rearPointTmp1[1], rearPointTmp2[0], rearPointTmp2[1]]) ||
                detectOverlap([rightPointTmp1[0], -rightPointTmp1[1], rightPointTmp2[0], -rightPointTmp2[1]], [leftPointTmp1[0], -leftPointTmp1[1], leftPointTmp2[0], -leftPointTmp2[1]])
                ) {
                    console.log("Overlapped !")
                    console.log( detectOverlap([frontPointTmp1[0], frontPointTmp1[1], frontPointTmp2[0], frontPointTmp2[1]], [rearPointTmp1[0], rearPointTmp1[1], rearPointTmp2[0], rearPointTmp2[1]]))
                    break;
                }
            returnSc = sc;
        }
        
    return returnSc;
        

}

function initializeVertexKeepRatio(image) {
    mapVal = image.width/image.height/2;
    var vertices = [ 
        -mapVal, 0.5,
        -mapVal, -0.5,
        mapVal, 0.5,
        mapVal, -0.5,
    ];
    return vertices;
}

function computeMatrix(aspectRatio, canvas, rotation, translation, scaling) {
    const matrix = mat4.create();
    // const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    mat4.translate(matrix, matrix, translation);
    mat4.scale(matrix, matrix, scaling);
    mat4.rotateZ(matrix, matrix, deg2Rad(rotation));
    // var scaling = [scaleFactor/canvas.width*800, scaleFactor/canvas.height*800, 1];
    // mat4.rotateX(matrix, matrix, deg2Rad(rotation[0]));
    // mat4.rotateY(matrix, matrix, deg2Rad(rotation[1]));
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

    createProgram() {
    
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, Shader.vertexCode);
        this.gl.compileShader(vertexShader);

        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, Shader.fragmentCode);
        this.gl.compileShader(fragmentShader);

        const program = this.gl.createProgram()
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        
        return program;
    }
}

// class Model {

// }
class BufferInitialization {
    static init(gl, coord, typeBuffer) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(typeBuffer, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coord), gl.STATIC_DRAW);
        return buffer
    }
}


class ImageLoading {
    gl;
    imageSRc;
    canvas;
    isLoaded;
    program;
    positionLocation;
    texCoordLocation;
    uniformLocations;
    image;
    translation;
    rotation;
    scaling;
    default_ratio;
   
    constructor(gl, canvas, imageSrc) {
        this.gl = gl;
        this.imageSRc = imageSrc;
        this.canvas = canvas;
        this.isLoaded = false;
        this.program = new Shader(this.gl).createProgram()
        this.setup();
        this.image = new Image();
        this.image.crossOrigin = "anonymous";
        this.image.src = this.imageSRc;
        this.rotation = 0;
        this.translation = [0, 0, 0];
        this.scaling = 1;
    }
    setup() {
        this.positionLocation = this.gl.getAttribLocation(this.program, "position");
        this.texCoordLocation = this.gl.getAttribLocation(this.program, "texCoord");
        this.uniformLocations = {
            transformMatrix: this.gl.getUniformLocation(this.program, `matrix`),
            u_image: this.gl.getUniformLocation(this.program, `u_image`),
        };    
    }
    loadImage(direction, texCoord, default_ratio=0.5, scale=1, vertices=[]) {
        this.scaling = scale;
        this.default_ratio = default_ratio;
        if (!this.isLoaded)
        {
            this.image.addEventListener('load', () => {
                this.isLoaded = true
                this.renderImage(vertices, texCoord, direction);
            })
        }
        else
            this.renderImage(vertices, texCoord);
    }
    renderImage(vertices, texCoord, direction) {
        var aspectRatio = this.image.width/this.image.height;
        vertices = vertices.length == 0 ? initializeVertexKeepRatio(this.image):vertices;
        console.log(vertices)
        var positionBuffer = BufferInitialization.init(this.gl, vertices, this.gl.ARRAY_BUFFER);
        
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.vertexAttribPointer(
            this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
            
        var texcoordBuffer = BufferInitialization.init(this.gl, texCoord, this.gl.ARRAY_BUFFER);
            
        this.gl.enableVertexAttribArray(this.texCoordLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texcoordBuffer);
        this.gl.vertexAttribPointer(
            this.texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
            
        
        // var u_image = this.uniformLocations.u_image;
       
        
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
        this.loadTexture(this.gl.TEXTURE0);
        this.gl.useProgram(this.program)
        // var deltaY = 1-aspectRatio;
        // var deltaX = 1-0.5
        // var scaling = [this.scaling*this.default_ratio, this.scaling/this.canvas.height*this.canvas.width*this.default_ratio, 1];
        // var getSc = selectScaler([vertices[0], vertices[1]], [vertices[6], vertices[7]], [0,0.5*scaling[1],0], [0.5*scaling[0], 0, 0], [0.5*scaling[0], 0, 0], [0, 0.5*scaling[1], 0], scaling)
        // console.log(getSc)
        // scaling[0] = scaling[0]*getSc;
        // scaling[1] = scaling[1]*getSc;
        var scaling = [1/this.canvas.width*800, 1/this.canvas.height*800, 1];
        if (direction == "left") {
            this.rotation = 90;
            this.translation[0] = -1+0.5*scaling[0];
            this.translation[1] = 0
        }
        else if (direction == "right") {
            this.rotation = -90;
            this.translation[0] = 1-0.5*scaling[0];
            this.translation[1] = 0
        }
        else if (direction == "front") {
            // this.translation[1] = 1-0.5*scaling[1];
            // this.translation[1] = Math.min(1-0.5*scaling[1],(aspectRatio/2+0.5)*scaling[1])
            // this.translation[0] = 0
        }
        else {
            this.rotation = 180;
            // this.translation[1] = -1+0.5*scaling[1];
            this.translation[1] = -Math.min(1-0.5*scaling[1],(aspectRatio/2+0.5)*scaling[1])
            this.translation[0] = 0
        }
        // var scaling = [this.scaling, this.scaling, 1]
        // var matrix = computeMatrix(aspectRatio, this.canvas, this.rotation, this.translation, scaling)
        var matrix = mat4.create()
        mat4.scale(matrix, matrix, scaling)
        // mat4.rotateZ(matrix, matrix, deg2Rad(180))
        this.gl.uniformMatrix4fv(this.uniformLocations.transformMatrix, false, matrix);
        this.draw_scene();
        
        
    }
    loadTexture(activeTexture) {
        var texture = this.gl.createTexture();
        this.gl.activeTexture(activeTexture);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGB, this.gl.RGB, this.gl.UNSIGNED_BYTE, this.image);
    }
    draw_scene() {
        var primitiveType = this.gl.TRIANGLE_STRIP;
        var offset  = 0;
        var count = 4;
        
        this.gl.drawArrays(primitiveType, offset, count);
    }
}

async function loadShadersAndRun(basePath) {
    const vertexShaderPromise = fetch(`${basePath}/vertexShader.glsl`)
        .then(result => result.text());
    const fragmentShaderPromise = fetch(`${basePath}/fragmentShader.glsl`)
        .then(result => result.text());

    return Promise.all([vertexShaderPromise, fragmentShaderPromise])
        .then(([vertexShaderCode, fragmentShaderCode]) => {
        Shader.setCode(vertexShaderCode, fragmentShaderCode);
        });
}

// var verCoord = {
//     front: [
//         -0.507, 0.264,
//         -0.507, -0.264,
//         0.507, 0.264,
//         0.507, -0.264,
//         ],
//     rear: [
//         -0.507, 0.264,
//         -0.507, -0.264,
//         0.507, 0.264,
//         0.507, -0.264,
//         ],
//     left: [
//         -0.507, 0.264,
//         -0.507, -0.264,
//         0.507, 0.264,
//         0.507, -0.264,
      
//         ],
//     right: [
//         -0.507, 0.264,
//         -0.507, -0.264,
//         0.507, 0.264,
//         0.507, -0.264,
//         ],
// };

// var texCoord = [
//     0.0, 1.0,
//     0.0, 0.0,
//     1.0, 1.0,
//     1.0, 0.0,
// ];


// loadShadersAndRun("shader").then(() => {
//     const canvas1 = document.getElementById('canvas1');
//     var gl = canvas1.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha:true} );
//     gl.clearColor(0, 50, 50, 1);
//     gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

//     frontImg = new ImageLoading(gl, canvas1, 'img/front.png');
//     frontImg.loadImage('front', verCoord.front, texCoord);

//     rearImg = new ImageLoading(gl, canvas1, 'img/rear.png');
//     rearImg.loadImage('rear', verCoord.rear, texCoord);

//     leftImg = new ImageLoading(gl, canvas1, 'img/left.png');
//     leftImg.loadImage('left', verCoord.left, texCoord);
//     // leftImg.loadImage('rear', verCoord.left, texCoord);

//     rightImg = new ImageLoading(gl, canvas1, 'img/right.png');
//     rightImg.loadImage('right', verCoord.right, texCoord);

// });



var texCoord = [
    0.0, 1.0,
    0.0, 0.0,
    1.0, 1.0,
    1.0, 0.0,
];


// Translate (-0.2,0.4)
// var verCoord = {
//     front: [
//         -0.707, 0.864,
//         -0.707, -0.064,
//         0.307, 0.864,
//         0.307, -0.064,
//         ],
// }
loadShadersAndRun("shader").then(() => {
    // const canvas1 = document.getElementById('canvas1');
    // var gl = canvas1.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha:true} );
    // gl.clearColor(0, 0, 0, 1);
    // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    

    // frontImg = new ImageLoading(gl, canvas1, 'img/front.png');
    // frontImg.loadImage('front', texCoord, 0.65);

    // rearImg = new ImageLoading(gl, canvas1, 'img/rear.png');
    // rearImg.loadImage('rear', texCoord, 0.65);

    // leftImg = new ImageLoading(gl, canvas1, 'img/left.png');
    // leftImg.loadImage('left', texCoord, 0.65);
    // // // leftImg.loadImage('rear', , texCoord, verCoord.left);

    // rightImg = new ImageLoading(gl, canvas1, 'img/right.png');
    // rightImg.loadImage('right', texCoord, 0.65);


    const canvas2 = document.getElementById('canvas2');
    var gl2 = canvas2.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha:true} );
    gl2.clearColor(0, 1, 0, 1);
    gl2.clear( gl2.COLOR_BUFFER_BIT | gl2.DEPTH_BUFFER_BIT );

    let commonScale = 1

    frontImg = new ImageLoading(gl2, canvas2, 'img/front.png');
    frontImg.loadImage('front', texCoord, commonScale);

    // rearImg = new ImageLoading(gl2, canvas2, 'img/rear.png');
    // rearImg.loadImage('rear', texCoord, commonScale);

    // leftImg = new ImageLoading(gl2, canvas2, 'img/left.png');
    // leftImg.loadImage('left', texCoord, commonScale);
    // // // // // // // leftImg.loadImage('rear', , texCoord, verCoord.left);

    // rightImg = new ImageLoading(gl2, canvas2, 'img/right.png');
    // rightImg.loadImage('right', texCoord, commonScale);

});

