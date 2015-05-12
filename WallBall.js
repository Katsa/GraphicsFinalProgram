
var vertexShader = "vertex-shader-phong";
var fragmentShader = "fragment-shader-phong";

window.onload = function() {
	
	var gl = initialize();
	var room = new World(gl, 9.81, 10);

	var viewMatrix = lookAt(vec3(0.0,0.5,1.0), vec3(0.0,0.0,-1.0), vec3(0,1,0));
    gl.uniformMatrix4fv(gl.u_ViewMatrix, false, flatten(viewMatrix));   // set the model transform (setting to identity initially)
    gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(mat4()));

	//var camera = new Camera(gl, 0, room.size()/2, room.size()/2);

    gl.clear(gl.COLOR_BUFFER_BIT |gl.DEPTH_BUFFER_BIT);
    room.draw();

}


function initialize() {
    var canvas = document.getElementById('gl-canvas');
    
    // Use webgl-util.js to make sure we get a WebGL context
    var gl = WebGLUtils.setupWebGL(canvas);
    
    if (!gl) {
        alert("Could not create WebGL context");
        return;
    }
  
    
    // set the viewport to be sized correctly
    gl.viewport(0,0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    // create program with our shaders and enable it
    gl.program = initShaders(gl, vertexShader, fragmentShader);
    gl.useProgram(gl.program);

    
    gl.u_ModelMatrix =  gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    gl.u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    gl.u_Projection = gl.getUniformLocation(gl.program, 'u_Projection');
    
    
    // set the perspective projection
    var projection  = perspective(70, canvas.width/canvas.height, 1, 800);
    gl.uniformMatrix4fv(gl.u_Projection, false, flatten(projection));
    
    // BEGIN LIGHTING SETUP
    var u_LightPosition= gl.getUniformLocation(gl.program, 'u_LightPosition');
    gl.uniform3f(u_LightPosition, 0.0,2.0,2.0);
    
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
    
    var u_DiffuseLight = gl.getUniformLocation(gl.program, 'u_DiffuseLight');
    gl.uniform3f(u_DiffuseLight, 0.9, 0.9, 0.9);

    var u_DiffuseLight = gl.getUniformLocation(gl.program, 'u_SpecularLight');
    gl.uniform3f(u_DiffuseLight, 0.9, 0.9, 0.9);

    var u_Coloring = gl.getUniformLocation(gl.program, 'u_Shininess');
    gl.uniform1f(u_Coloring, 3.0);
    // END LIGHTING SETUP


    return gl;
}


function World(gl, gravity, friction) {
	var balls = [];
    

    var vertexBuffer;
    var normalBuffer;
    var indexBuffer;
    var FSIZE;
    var numVertices;
    
   
    // vertices of the cube, we are duplicating points because the faces have different normals
    var vertices  = new Float32Array([
          1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0,-1.0, 1.0,  1.0,-1.0, 1.0, // front face
          1.0, 1.0, 1.0,  1.0,-1.0, 1.0,  1.0,-1.0,-1.0,  1.0, 1.0,-1.0, // right face
          1.0, 1.0,-1.0,  1.0,-1.0,-1.0, -1.0,-1.0,-1.0, -1.0, 1.0,-1.0, // back face
         -1.0, 1.0,-1.0, -1.0,-1.0,-1.0, -1.0,-1.0, 1.0, -1.0, 1.0, 1.0, // left face
          1.0, 1.0, 1.0,  1.0, 1.0,-1.0, -1.0, 1.0,-1.0, -1.0, 1.0, 1.0, // top face
          1.0,-1.0, 1.0, -1.0,-1.0, 1.0, -1.0,-1.0,-1.0,  1.0,-1.0,-1.0, // bottom face
    ]);
    
    
    var normals = new Float32Array([
        0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0, // front face
       -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // right face/
        0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0,1.0,   0.0, 0.0, 1.0, // back face
        1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // left face
        0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // top face
        0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // bottom face
    ]);
    

    
    var indices = new Uint8Array([
       0,1,2,  0,2,3, // front face
       4,5,6,  4,6,7,   // right face
       8,9,10, 8,10,11, // back face
       12,13,14,  12,14,15, // left face
       16,17,18, 16,18,19, // top face
       20,21,22, 20,22,23 // bottom face
    ]);
    
    
    
    
    numVertices = indices.length;
    FSIZE = vertices.BYTES_PER_ELEMENT;
    
    
    vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the vertex buffer');
        return -1;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    
    normalBuffer = gl.createBuffer();
    if (!normalBuffer) {
        console.log('Failed to create the normal buffer');
        return -1;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);


    indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the index buffer');
        return -1;
    }

    
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    
    
    
    this.draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        

        var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
        if (a_Position < 0) {
            console.log('Failed to get storage location');
            return -1;
        }
        
        
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0,0);
        gl.enableVertexAttribArray(a_Position);

        
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        var a_Normal= gl.getAttribLocation(gl.program, 'a_Normal');
        if (a_Normal < 0) {
            console.log('Failed to get storage location');
            return -1;
        }
        
        
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false,  0,0);
        gl.enableVertexAttribArray(a_Normal);
        
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        
        gl.drawElements(gl.TRIANGLES, numVertices, gl.UNSIGNED_BYTE, 0);
        
    }
}

function Balls(gl, radius, mass, bounciness) {
	var velocity = 0.0;


}

