(function(global) {
    var glutils = {
        version: '0.0.1',
        checkWebGL: function(canvas, opts) {
            var ctxs = ["webgl", "experimental-webgl"]
            for (let i = 0; i < ctxs.length; i++){
                try {
                    gl = canvas.getContext(ctxs[i], opts);
                } catch (e) {}
                if (gl) {break;}
            }
            if (!gl) {
                alert("WebGL not available")
            }
        },
        createProgram: function (gl, vertexShader, fragmentShader) {
            var program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
        },
        getShader: function (gl, type, source) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
        }
    }
})