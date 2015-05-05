window.onload =  function.main() {
	
	var gl = initialize();
	var room = new World();

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
    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    
    gl.u_ModelMatrix =  gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    gl.u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    gl.u_Projection = gl.getUniformLocation(gl.program, 'u_Projection');
    
    
    // set the perspective projection
    var projection  = perspective(50, canvas.width/canvas.height, .5, 100);
    gl.uniformMatrix4fv(gl.u_Projection, false, flatten(projection));
    
    
    return gl;
}


function World(size, gravity, friction) {
	var balls = [];
}

function Balls(radius, mass, bounciness) {
	var velocity = 0.0;


}

