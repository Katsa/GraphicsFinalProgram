
var vertexShader = "vertex-shader-phong";
var fragmentShader = "fragment-shader-phong";

var timeElapsed = 0.0;

window.onload = function() {
	
	var gl = initialize();
    var g_last = Date.now();

	var room = new World(gl, 9.81, 10);
    room.addBall(gl, 0.05, 1.0, 0.8);
    room.addBall(gl, 0.05, 1.0, 0.8);
    room.addBall(gl, 0.05, 1.0, 0.8);
    room.addBall(gl, 0.05, 1.0, 0.8);
    room.addBall(gl, 0.05, 1.0, 0.8);

    //var camera = new Camera(gl, 0, room.size()/2, room.size()/2);

	var viewMatrix = lookAt(vec3(0.0,0.0,2.4), vec3(0.0,0.0,-1.0), vec3(0,1,0));
    gl.uniformMatrix4fv(gl.u_ViewMatrix, false, flatten(viewMatrix));   // set the model transform (setting to identity initially)

    Promise.all([ initializeTexture(gl, 1, 'images/hardwood.jpg')])
      .then(function () {tick();})
      .catch(function (error) {alert('Failed to load texture '+  error.message);});




    var tick = function(){
        // update system
        var now = Date.now();
        timeElapsed = (now - g_last)/1000;
        //console.log(timeElapsed);
        g_last = now;
    
        gl.clear(gl.COLOR_BUFFER_BIT |gl.DEPTH_BUFFER_BIT);
        //console.log("hi")
        room.draw();

        requestAnimationFrame(tick);
    };
    
    //tick();
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

    gl.currentTransform = scale(1.0,1.0,1.0);
    gl.matrixStack = new Array();

    gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(gl.currentTransform));
    
    
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

    //get location of attribute text_coord
    gl.a_TexCoord = gl.getAttribLocation(gl.program, "a_TexCoord");
    gl.enableVertexAttribArray(gl.a_TexCoord);
    gl.u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');


    return gl;
}


function World(gl, gravity, friction) {
	this.balls = [];
    this.walls = new Walls(gl);
    this.gravity = 0.6;
    


    this.addBall = function(gl, radius, mass, bounciness) {
        this.balls.push(new Ball(gl, radius, mass, bounciness)) //Radius, Mass, Bouncinesst


    }
    this.draw = function() {
        this.walls.draw();

        for (i = 0; i < this.balls.length; i++) {
            var ball = this.balls[i];
            ball.updatePosition();

        }   

        for (i = 0; i < this.balls.length; i++) {
            var ball = this.balls[i];
            ball.draw(); 
        } 
    }

    function Walls(gl) {

        var vertexBuffer;
        var normalBuffer;
        var indexBuffer;
        var texBuffer;
        //var FSIZE;
        //var numVertices;
        
       
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

        var textureCoordinates = new Float32Array([
           1.0, 1.0,  0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // front face
           1.0, 1.0,  0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // right face
           1.0, 1.0,  0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // back face
           1.0, 1.0,  0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // left face
           1.0, 1.0,  0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // top face
           1.0, 1.0,  0.0, 1.0, 0.0, 0.0, 1.0, 0.0 // bottom face
        ]);
        

        
        var indices = new Uint8Array([
           //0,1,2,  0,2,3, // front face
           4,5,6,  4,6,7,   // right face
           8,9,10, 8,10,11, // back face
           12,13,14,  12,14,15, // left face
           16,17,18, 16,18,19, // top face
           20,21,22, 20,22,23 // bottom face
        ]);
        
        
        
        
        vertexBuffer = createBuffer(gl, gl.ARRAY_BUFFER, vertices, 'vertex', gl.STATIC_DRAW);
        normalBuffer = createBuffer(gl, gl.ARRAY_BUFFER, normals, 'normal', gl.STATIC_DRAW);
        indexBuffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, indices, 'index', gl.STATIC_DRAW);
        texBuffer = createBuffer(gl, gl.ARRAY_BUFFER, textureCoordinates, 'texture coordinate', gl.STATIC_DRAW);

        
        
        
        this.draw = function() {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
            gl.vertexAttribPointer(gl.a_TexCoord, 2, gl.FLOAT, false,  0,0);

            gl.uniform1i(gl.u_Sampler,1);

            var u_ColorType = gl.getUniformLocation(gl.program, 'u_ColorType');
            gl.uniform1i(u_ColorType, 1);

            gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(gl.currentTransform));

            enableAttribute(gl, vertexBuffer, 'a_Position', 3, 0, 0);
            enableAttribute(gl, normalBuffer, 'a_Normal', 3, 0, 0);
            enableAttribute(gl, texBuffer, 'a_TexCoord', 2, 0, 0);
            
            
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
        }
    }

    /*
     * This is a constructor that we can use to build Sphere objects.
     * Most of this will look very familiar once we have generated the points.
     *
     * the only concession we have to the lighting model is that we grab a second attribute
     * for the normals and associate them with the vertex buffer. We don't need to duplicate
     * the data since it is all the same.
     */
    function Ball(gl, radius, mass, bounciness) {

        this.radius = radius;
        this.bounciness = bounciness;
        this.position = vec3(-1+Math.random()*2,-1+Math.random()*2,-1+Math.random()*2);
        this.velocity = vec3(-5+Math.random()*10,-5+Math.random()*10,-5+Math.random()*10);

        var vertexBuffer;
        var indexBuffer;
        var normalBuffer;
        var texBuffer;

        /*
        This throws an error if we don't pass in informatin for the texture Buffer even though we aren't using it. How do we get rid of this?

        */

     /* Initialize the shape */
        
        var vertices = [];
        var normals = [];
        var textureCoordinates = new Float32Array([])
        var indices = [];
        var numSteps = 100;

        // call the initialization function to jumpstart this object
        setSteps(numSteps);
        
        vertexBuffer = createBuffer(gl, gl.ARRAY_BUFFER, vertices, 'vertex', gl.STATIC_DRAW);
        normalBuffer = createBuffer(gl, gl.ARRAY_BUFFER, normals, 'normal', gl.STATIC_DRAW);
        indexBuffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, indices, 'index', gl.STATIC_DRAW);
        texBuffer = createBuffer(gl, gl.ARRAY_BUFFER, textureCoordinates, 'texture coordinate', gl.STATIC_DRAW);



        this.updatePosition = function () {
            //console.log(timeElapsed);
    
            this.velocity[1] = -gravity*timeElapsed+this.velocity[1];

            if (this.position[1] <= -1.0 + this.radius) {
                this.velocity[0] = this.velocity[0]*0.5;
                this.velocity[2] = this.velocity[2]*0.5;
            }

            var x = this.position[0] + this.velocity[0]*timeElapsed;
            var y = this.position[1] + this.velocity[1]*timeElapsed;
            var z = this.position[2] + this.velocity[2]*timeElapsed;

            //console.log(y)
            
            if (Math.abs(x) > 1.0 - this.radius) {
                this.velocity[0] = -this.velocity[0]*this.bounciness;
            } else {
                this.position[0] = x
            }

            if (Math.abs(y) > 1.0 - this.radius) {
                this.velocity[1] = -this.velocity[1]*this.bounciness;
            } else {
                this.position[1] = y;
            }
            
            if (Math.abs(z) > 1.0 - this.radius) {
                this.velocity[2] = -this.velocity[2]*this.bounciness;
            } else {
                this.position[2] = z;
            }
            
        }


   

        
        /*
         * This function initializes the object. It does all of the grunt work computing all of the
         * points and indices. This has been made a function to make this object mutable. We can
         * decide we want to change the number of points and recalculate the shape.
         */ 
        function setSteps(steps){
            numSteps = steps; // the number of samples per circle
            var step = 2*Math.PI/numSteps; // angular different beteen samples
         
            vertices = [];
            indices = [];
            // push north pole since it is only a single point
            vertices.push(0.0);
            vertices.push(1.0);
            vertices.push(0.0);
            
            // create the points for the sphere
            // t is an angle that sketches out a circle (0 - 2PI)
            // s controls the height and the radius of the circle slices
            // we only need 0 - PI 
            // x = cos(t) * sin(s)
            // y = cos(s)
            // z = sin(t) * sin(s)
            for (var s= 1; s < numSteps; s++){
                for (var t = 0; t < numSteps; t++){
                    var tAngle = t*step;
                    var sAngle = s*step/2;
                    vertices.push(Math.cos(tAngle)*Math.sin(sAngle));
                    vertices.push(Math.cos(sAngle));
                    vertices.push(Math.sin(tAngle)*Math.sin(sAngle));
                    
                }
            }
            
        
            // push south pole -- again just a single point
            vertices.push(0.0);
            vertices.push(-1.0);
            vertices.push(0.0);
            
            //convert to the flat form
            vertices = new Float32Array(vertices);
            normals = new Float32Array(vertices);
            textureCoordinates = new Float32Array(vertices);

            

            
            // north pole
            // this is going to form a triangle fan with the pole and the first circle slice
            indices.push(0);
            for (var i = 1; i <= numSteps; i++){
                indices.push(i);
            }
            indices.push(1);
            
            // south pole
            // another triangle fan, we grab the last point and the last circle slice
            indices.push(vertices.length/3 - 1);
            for (var i = 1; i <= numSteps; i++){
                indices.push(vertices.length/3 - 1 - i);
            }
            indices.push(vertices.length/3 - 2);
            
            
           // the bands
           // The rest of the skin is made up of triangle strips that connect two neighboring slices
           // the outer loop controls which slice we are on and the inner loop iterates around it
            
            for (var j = 0; j < numSteps-2; j++){
                
                 for (var i = j*numSteps + 1; i <= (j+1)*numSteps; i++){
                    indices.push(i);
                    indices.push(i+numSteps);
                }
                
                // grab the first two points on the slices again to close the loop
                indices.push(j*numSteps +1);
                indices.push(j*numSteps +1 + numSteps);
                
            }
            
            
            // convert to our flat form
            indices = new Uint16Array(indices);

           
          

        }
        
        
        /*
         * This method is called when we want to draw the shape.
         */
        this.draw = function() {
            // HAV TO HAVE SOMETHING
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
            gl.vertexAttribPointer(gl.a_TexCoord, 2, gl.FLOAT, false,  0,0);

            gl.uniform1i(gl.u_Sampler,1);


            //



            var u_ColorType = gl.getUniformLocation(gl.program, 'u_ColorType');
            gl.uniform1i(u_ColorType, 0)


            gl.matrixStack.push(gl.currentTransform);   
            gl.currentTransform = mult(gl.currentTransform, translate(this.position[0], this.position[1], this.position[2])); 
            gl.currentTransform = mult(gl.currentTransform, scale(this.radius, this.radius, this.radius)); 
            gl.uniformMatrix4fv(gl.u_ModelMatrix, false, flatten(gl.currentTransform));

            // need to rebind the array buffer to the appropriate VBO in cse some other buffer has been made active
        
            
            enableAttribute(gl, vertexBuffer, 'a_Position', 3, 0, 0);
            enableAttribute(gl, normalBuffer, 'a_Normal', 3, 0, 0);
            enableAttribute(gl, texBuffer, 'a_TexCoord', 2, 0, 0);
            
        
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        
            // draw the shape

            var offset = 0; // keep track of how far into the index list we are
            // draw the north pole traignel fan
            //console.log(indices);
            gl.drawElements(gl.TRIANGLE_FAN, numSteps+2, gl.UNSIGNED_SHORT,0);
            offset = (numSteps+2)*indices.BYTES_PER_ELEMENT;
            
            // draw the second triangle fan for the south pole
            gl.drawElements(gl.TRIANGLE_FAN, numSteps+2, gl.UNSIGNED_SHORT,offset);
            offset+=(numSteps+2)*indices.BYTES_PER_ELEMENT;
            
            
            // loop through the bands
            for (var i = 0; i < numSteps-2; i++){
                gl.drawElements(gl.TRIANGLE_STRIP, numSteps*2 +2, gl.UNSIGNED_SHORT,offset);
                offset += (numSteps*2 + 2)* indices.BYTES_PER_ELEMENT;
            }
            gl.currentTransform = gl.matrixStack.pop();
                
        }
    
        
    }
}

function initializeTexture(gl, textureid, filename) {
    
    return new Promise(function(resolve, reject){
       var texture = gl.createTexture();

        var image = new Image();
    
    
        image.onload = function(){
            
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            gl.activeTexture(gl.TEXTURE0 + textureid);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); //second time?

            gl.generateMipmap(gl.TEXTURE_2D);
            resolve();
        }
        
        
        image.onerror = function(error){
            reject(Error(filename));
        }
    
        image.src = filename; 
    });
}



/*
 * This is helper function to create buffers.
 */
function createBuffer(gl, destination, data, name, type){
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the ',name,' buffer');
        return -1;
    }
    
    gl.bindBuffer(destination, buffer);
    gl.bufferData(destination, data, type);
    return buffer;
}


/*
 * This is a new helper function to simplify enabling attributes.
 * Note that this no longer fails if the attribute can't be found. It gives us a warning, but doesn't crash.
 * This will allow us to use different shaders with different attributes.
 */ 
function enableAttribute(gl, buffer, name, size, stride, offset){
   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   var attribute = gl.getAttribLocation(gl.program, name);
   if (attribute >= 0) {
       gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0,0);
       gl.enableVertexAttribArray(attribute);
   }else{
       console.log('Warning: Failed to get ',name );

   }


}















