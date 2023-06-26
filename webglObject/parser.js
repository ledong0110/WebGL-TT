class Visitor {
    visit(ctx) {
        return ctx.accept(this)
    }
    visitObjFile(ctx){}
    visitObj(ctx){}
    visitPosition(ctx){}
    visitVertice(ctx){}
    visitTexCoord(ctx){}
    visitNormals(ctx){}
    visitColor(ctx){}
}

class Position {
    x;
    y;
    z;
    constructor(x , y, z) {
        this.x = x;
        this.y = y;
        if (!isNaN(z))
            this.z = z;
    }
    accept(v) {
        return v.visitPosition(this);
    }
}
class ObjFile {
    list_obj;
    constructor () {
        this.list_obj = [];
    }
    accept(v) {
       return  v.visitObjFile(this);
    }
}
class Obj {
   
    vertice;
    normals;
    texCoord;

    constructor() {
        
        this.vertice = new Vertice();
        this.normals = new Normals();
        this.texCoord = new TexCoord();
    }

    accept(v) {
        return v.visitObj(this);
    }
}

class Vertice {
    positions;
    colors;
    constructor() {
        this.positions = [];
        this.colors = [];
    }
    accept(v) {
        return v.visitVertice(this)
    }
}


class TexCoord {
    positions;
    constructor () {
        this.positions = [];
    }
    accept(v, o) {
        return v.visitTexCoord(this)
    }
}

class Normals {
    positions;
    constructor () {
        this.positions = [];
    }
    accept(v) {
        return v.visitNormals(this)
    }
}

class Color {
    r;
    g;
    b;
    constructor(r,g,b) {
        this.r = r;
        this.g = g;
        this.b = b;
    }
    accept(v) {
        return v.visitColor(this)
    }
}


const parser = (text) => {
    const objPositions = [[0, 0, 0]];
    const objTexcoords = [[0, 0]];
    const objNormals = [[0, 0, 0]];
    const objColors = [[0, 0, 0]];
    let objFile, obj, vertices, normals, texCoord;
    objFile = new ObjFile();
    const addVertex = (vert) => {
        const ptn = vert.split('/');
        ptn.forEach((objIdxStr, i) => {
            if (!objIdxStr) return;
            const objIdx = parseInt(objIdxStr);
            if (i == 0)
            {
                const idx = objIdx + (objIdx >= 0 ? 0 : objPositions[i].length);
              
                vertices.positions.push(new Position(...objPositions[idx]))
                if (objColors.length > 1) {
                    vertices.colors.push(new Color(...objColors[idx]));
                }
            }
            else if (i == 1)
            {
                const idx = objIdx + (objIdx >= 0 ? 0 : objTexcoords[i].length);
                texCoord.positions.push(new Position(...objTexcoords[idx]));
            }
            else {
                const idx = objIdx + (objIdx >= 0 ? 0 : objNormals[i].length);
                normals.positions.push(new Position(...objNormals[idx]));
            }
        })
        
    }
    const keywordHandler = {
        v:(parts) => {
            if (parts.length > 3) {
                objPositions.push(parts.slice(0, 3).map(parseFloat));
                objColors.push(parts.slice(3).map(parseFloat));
            } else {
                objPositions.push(parts.map(parseFloat));
            }
        },
        vn: (parts) => {
            objNormals.push(parts.map(parseFloat));
        },
        vt: (parts) => {
            objTexcoords.push(parts.map(parseFloat));
        },
        f: (parts) => {
            const numTriangles = parts.length - 2;
            for (let tri = 0; tri < numTriangles; tri++){
                addVertex(parts[tri]);
                addVertex(parts[tri+1]);
                addVertex(parts[tri+2]);
            }
        },
        s: () => {},
        o: (parts, unparsedArgs) => {
            obj = new Obj();
            objFile.list_obj.push(obj);
            vertices = obj.vertice;
            normals = obj.normals;
            texCoord = obj.texCoord;
        }

    };

    const keywordRegex = /(\w*)(?: )*(.*)/;
    const lines = text.split('\n');
    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
        const line = lines[lineNo].trim();
        if (line === '' || line.startsWith('#')) continue;
        
        const m = keywordRegex.exec(line);
        if (!m) continue;

        const [, keyword, unparsedArgs] = m;
        const parts = line.split(/\s+/).slice(1);
        const handler = keywordHandler[keyword];
        if (!handler) {
            console.warn('Unhandled keyword', keyword);
            continue;
        }
        handler(parts, unparsedArgs)
    }
    return objFile
}


class GLParseVisitor extends Visitor{
    visitObjFile(ctx){
        return ctx.list_obj.map((obj)=>this.visit(obj))
    }
    visitObj(ctx){
        const [positions, colors] = this.visit(ctx.vertice);
 
        const normals = this.visit(ctx.normals);
    
        const texCoord = this.visit(ctx.texCoord);
      
        return{positions, colors, normals, texCoord};
    }
    visitPosition(ctx){
        // console.log([ctx.x, ctx.y])
        return isNaN(ctx.z) ? [ctx.x, ctx.y] : [ctx.x, ctx.y, ctx.z];
    }
    visitVertice(ctx){
        const positions = [];
        const colors = [];
        // ?? reduce slower than for ?????? x 3.141516
        for (const pos of ctx.positions) 
            positions.push(...this.visit(pos));
        for (const color of ctx.colors) 
            colors.push(...this.visit(color));
       
        return [positions, colors];
    }
    visitTexCoord(ctx){
        const texCoord = [];
        for (const tex of ctx.positions)
            texCoord.push(...this.visit(tex));
        
        return texCoord;
    }
    visitNormals(ctx){
        const normals = [];
        for (const normal of ctx.positions)
            normals.push(...this.visit(normal))
        return normals;
    }
    visitColor(ctx){
        return [ctx.r, ctx.g, ctx.b];
    }
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

function randomColor() { return [Math.random(), Math.random(), Math.random()]}
const vs = `
precision mediump float;

attribute vec3 position;
attribute vec3 color;
varying vec3 vColor;

uniform mat4 matrix;
uniform mat4 projection_matrix;

void main() {
    vColor = color;
    gl_Position = matrix * vec4(position, 1.0);
    gl_PointSize = 10.0;
}
`;

  const fs = `
  precision mediump float;
  
  varying vec3 vColor;
  
  void main() {
      
      gl_FragColor = vec4(vColor,1);
  }
  `;
async function mains() {
    const canvas = document.querySelector("#canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) {
        return;
    }
    const response = await fetch('obj/bowl_topview.obj');  
    const text = await response.text();
    const obj = parser(text);
    const visitor = new GLParseVisitor();
    // 0: postion 1: color 2: normals 3: texcoord
    let extractArray = visitor.visit(obj)[0];
    if (extractArray.colors.length == 0) {
        
        for (let i = 0; i < extractArray.positions.length/3; i++) {
            extractArray.colors.push(...randomColor());
        }
    }
   

    Shader.setCode(vs, fs);
    let program = new Shader(gl).createProgram()
    let positionBuffer = BufferInitialization.init(gl, extractArray.positions, gl.ARRAY_BUFFER)
    
    let colorBuffer = BufferInitialization.init(gl, extractArray.colors, gl.ARRAY_BUFFER);

    const positionLocation = gl.getAttribLocation(program, `position`)
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0 ,0);

    const colorLocation = gl.getAttribLocation(program, `color`)
    gl.enableVertexAttribArray(colorLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0 ,0);

    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    const matrixUniform = gl.getUniformLocation(program, `matrix`)
    const matrix = mat4.create()
    // mat4.translate(matrix, matrix, [.2, .5, 0]);
    mat4.scale(matrix, matrix, [0.25, 0.25, 0.25]);
    
    function animate() {
        // requestAnimationFrame(animate);
        // mat4.rotateY(matrix, matrix, Math.PI/2);
        mat4.rotateZ(matrix, matrix, -Math.PI/2 );
       mat4.rotateX(matrix, matrix, Math.PI/2 );
        // mat4.multiply(finalMatrix, projectionMatrix, matrix);
        // gl.uniformMatrix4fv(uniformLocations.matrix, false, finalMatrix);
        gl.uniformMatrix4fv(matrixUniform, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, extractArray.positions.length/3);
    }
    
    animate();
  
}

// mains();