const parseObjFile = (text) => {
    const objPositions = [[0, 0, 0]];
    const objTexcoords = [[0, 0]];
    const objNormals = [[0, 0, 0]];
    const objColors = [[0, 0, 0]];
    const objVertexData = [
        objPositions,
        objTexcoords,
        objNormals,
        objColors,
    ];
    let webglVertexData = [ 
        [],
        [],
        [],
        [],
    ];
    const materialLibs = [];
    const geometries = [];
    let geometry;
    let groups = ['default'];
    let material = 'default';
    let object = 'default';

    function newGeometry() {
        if (geometry && geometry.data.position.length) {
            geometry = undefined;
        }
    }

    function setGeometry() {
        if (!geometry) {
            const position = [];
            const texCoord = [];
            const normal = [];
            const color = [];
            webglVertexData = [
                position,
                texCoord,
                normal,
                color,
            ]
            
            geometry = {
                object,
                groups,
                material,
                data: {
                position,
                texcoord,
                normal,
                color,
                },
            };
            geometries.push(geometry);
        }
    }
    function addVertex(vert) {
        const ptn = vert.split('/');
        ptn.forEach((objIndexStr, i) => {
          if (!objIndexStr) {
            return;
          }
          const objIndex = parseInt(objIndexStr);
          const index = objIndex + (objIndex >= 0 ? 0 : objVertexData[i].length);
          webglVertexData[i].push(...objVertexData[i][index]);
          // if this is the position index (index 0) and we parsed
          // vertex colors then copy the vertex colors to the webgl vertex color data
          if (i === 0 && objColors.length > 1) {
            geometry.data.color.push(...objColors[index]);
          }
        });
      }
    const keywords = {
        v(parts) {
          // if there are more than 3 values here they are vertex colors
          if (parts.length > 3) {
            objPositions.push(parts.slice(0, 3).map(parseFloat));
            objColors.push(parts.slice(3).map(parseFloat));
          } else {
            objPositions.push(parts.map(parseFloat));
          }
        },
        vn(parts) {
          objNormals.push(parts.map(parseFloat));
        },
        vt(parts) {
          // should check for missing v and extra w?
          objTexcoords.push(parts.map(parseFloat));
        },
        f(parts) {
          setGeometry();
          const numTriangles = parts.length - 2;
          for (let tri = 0; tri < numTriangles; ++tri) {
            addVertex(parts[0]);
            addVertex(parts[tri + 1]);
            addVertex(parts[tri + 2]);
          }
        },
        s: noop,    // smoothing group
        mtllib(parts, unparsedArgs) {
          // the spec says there can be multiple filenames here
          // but many exist with spaces in a single filename
          materialLibs.push(unparsedArgs);
        },
        usemtl(parts, unparsedArgs) {
          material = unparsedArgs;
          newGeometry();
        },
        g(parts) {
          groups = parts;
          newGeometry();
        },
        o(parts, unparsedArgs) {
          object = unparsedArgs;
          newGeometry();
        },
      };
}

async function main() {
    const response = await fetch('obj/E34_Body.obj');  
    const text = await response.text();
    console.log(text);

}

main()