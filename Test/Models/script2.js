

var main=function() {
  var CANVAS=document.getElementById("AdvGraphics");
  


  /*========================= PARTICLES ========================= */

     var PARTICLES=[];

  var reset_particle=function(particle) {
    particle.position[0]=(Math.random()-0.5)*5;      //X
    particle.position[1]=(Math.random()-0.5)*20;   //Y
    particle.position[2]=(Math.random()-0.5)*7;       //Z

    particle.speed[0]=-0.8*(Math.random()-0.5);      //VX
    particle.speed[1]= 0.4;                //VY
    particle.speed[2]=-0.08*(Math.random()-0.5);     //VZ

    particle.scale=0.01+0.002*Math.random();
    particle.density=0.1+0.3*Math.abs(particle.position[0]/2);
  };

  for (var i=0; i<10000; i++) {
    var particle={
      density: 0,
      speed: [0,0,0],
      position:[0,0,0],
      scale: 0
    };
    reset_particle(particle);
    PARTICLES.push(particle);
  }

  /*========================= CAPTURE MOUSE EVENTS ========================= */

  var AMORTIZATION=0.95;
  var drag=false;
  var old_x, old_y;
  var dX=0, dY=0;

  var mouseDown=function(e) {
    drag=true;
    old_x=e.pageX, old_y=e.pageY;
    e.preventDefault();
    return false;
  };

  var mouseUp=function(e){
    drag=false;
  };

  var mouseMove=function(e) {
    if (!drag) return false;
    dX=(e.pageX-old_x)*Math.PI/CANVAS.width,
      dY=(e.pageY-old_y)*Math.PI/CANVAS.height;
    THETA+=dX;
    PHI+=dY;
    old_x=e.pageX, old_y=e.pageY;
    e.preventDefault();
  };

  CANVAS.addEventListener("mousedown", mouseDown, false);
  CANVAS.addEventListener("mouseup", mouseUp, false);
  CANVAS.addEventListener("mouseout", mouseUp, false);
  CANVAS.addEventListener("mousemove", mouseMove, false);

  /*========================= GET WEBGL CONTEXT ========================= */
  var GL;
  try {
    GL = CANVAS.getContext("experimental-webgl", {antialias: true});
  } catch (e) {
    alert("You are not webgl compatible :(") ;
    return false;
  }

 /*========================= SHADERS ========================= */
  /*jshint multistr: true */

  var shader_vertex_source="\n\
attribute vec3 position;\n\
uniform mat4 Pmatrix,Vmatrix,Mmatrix;\n\
uniform vec3 posParticle;\n\
uniform float scaleParticle;\n\
\n\
attribute vec2 uv;\n\
varying vec2 vUV, vUVSmoke;\n\
\n\
\n\
void main(void) {\n\
vec4 clipPosition=Pmatrix*(Vmatrix*Mmatrix*vec4(posParticle, 1.)+scaleParticle*vec4(position,0.));\n\
gl_Position = clipPosition;\n\
vUV=.5*clipPosition.xy/clipPosition.w+vec2(.5,.5);\n\
vUVSmoke=uv;\n\
}";

  var shader_fragment_source="\n\
precision mediump float;\n\
uniform float density;\n\
uniform sampler2D samplerVideo, samplerSmoke;\n\
const vec4 SMOKECOLOR = vec4(1.,1.,1.,1.);\n\
varying vec2 vUV, vUVSmoke;\n\
\n\
\n\
void main(void) {\n\
vec4 videoColor= texture2D(samplerVideo, vUV);\n\
vec4 smokeColor = texture2D(samplerSmoke, vUVSmoke);\n\
vec4 color = mix(SMOKECOLOR, videoColor, 0.5);\n\
color.a=smokeColor.a;\n\
gl_FragColor=color;\n\
}";

  var get_shader=function(source, type, typeString) {
    var shader = GL.createShader(type);
    GL.shaderSource(shader, source);
    GL.compileShader(shader);
    if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
      alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
      return false;
    }
    return shader;
  };

  var shader_vertex=get_shader(shader_vertex_source, GL.VERTEX_SHADER, "VERTEX");
  var shader_fragment=get_shader(shader_fragment_source, GL.FRAGMENT_SHADER, "FRAGMENT");

  var SHADER_PROGRAM=GL.createProgram();
  GL.attachShader(SHADER_PROGRAM, shader_vertex);
  GL.attachShader(SHADER_PROGRAM, shader_fragment);

  GL.linkProgram(SHADER_PROGRAM);

  var _Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
  var _Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
  var _Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

  var _posParticle = GL.getUniformLocation(SHADER_PROGRAM, "posParticle");
  var _scaleParticle = GL.getUniformLocation(SHADER_PROGRAM, "scaleParticle");

  var _density = GL.getUniformLocation(SHADER_PROGRAM, "density");
  var _samplerSmoke = GL.getUniformLocation(SHADER_PROGRAM, "samplerSmoke");
  var _samplerVideo = GL.getUniformLocation(SHADER_PROGRAM, "samplerVideo");
  var _uv = GL.getAttribLocation(SHADER_PROGRAM, "uv");
  var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");

  GL.enableVertexAttribArray(_uv);
  GL.enableVertexAttribArray(_position);

  GL.useProgram(SHADER_PROGRAM);
  GL.uniform1i(_samplerVideo, 0);
  GL.uniform1i(_samplerSmoke, 1);


  /*========================= THE QUAD ========================= */
  //POINTS :
  var quad_vertex=[
    -1,-1,0,    0,0,
    1,-1,0,     1,0,
    1, 1,0,     1,1,
    -1, 1,0,    0,1
  ];

  var QUAD_VERTEX= GL.createBuffer ();
  GL.bindBuffer(GL.ARRAY_BUFFER, QUAD_VERTEX);
  GL.bufferData(GL.ARRAY_BUFFER,
                new Float32Array(quad_vertex),
    GL.STATIC_DRAW);

  //FACES :
  var quad_faces = [0,1,2,  0,2,3];

  var QUAD_FACES= GL.createBuffer ();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, QUAD_FACES);
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(quad_faces),
    GL.STATIC_DRAW);
	/*========================= THE CUBE ========================= */
  //POINTS :
  var cube_vertex=[
    -1,-1,-1,     1,1,0,
    1,-1,-1,     1,1,0,
    1, 1,-1,     1,1,0,
    -1, 1,-1,     1,1,0,

    -1,-1, 1,     0,0,1,
    1,-1, 1,     0,0,1,
    1, 1, 1,     0,0,1,
    -1, 1, 1,     0,0,1,

    -1,-1,-1,     0,1,1,
    -1, 1,-1,     0,1,1,
    -1, 1, 1,     0,1,1,
    -1,-1, 1,     0,1,1,

    1,-1,-1,     1,0,0,
    1, 1,-1,     1,0,0,
    1, 1, 1,     1,0,0,
    1,-1, 1,     1,0,0,

    -1,-1,-1,     1,0,1,
    -1,-1, 1,     1,0,1,
    1,-1, 1,     1,0,1,
    1,-1,-1,     1,0,1,

    -1, 1,-1,     0,1,0,
    -1, 1, 1,     0,1,0,
    1, 1, 1,     0,1,0,
    1, 1,-1,     0,1,0

  ];

  var CUBE_VERTEX= GL.createBuffer ();
  GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
  GL.bufferData(GL.ARRAY_BUFFER,
                new Float32Array(cube_vertex),
    GL.STATIC_DRAW);

  //FACES :
  var cube_faces = [
    0,1,2,
    0,2,3,

    4,5,6,
    4,6,7,

    8,9,10,
    8,10,11,

    12,13,14,
    12,14,15,

    16,17,18,
    16,18,19,

    20,21,22,
    20,22,23

  ];
  var CUBE_FACES= GL.createBuffer ();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(cube_faces),
    GL.STATIC_DRAW);
	 /*========================= THE TRIANGLE ========================= */
  //POINTS :
  var triangle_vertex=[
    -1,-1,-5,
    0,0,1,
    1,-1,-5,
    1,1,0,
    1,1,-5,
    1,0,0
  ];

  var TRIANGLE_VERTEX= GL.createBuffer ();
  GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
  GL.bufferData(GL.ARRAY_BUFFER,
                new Float32Array(triangle_vertex),
    GL.STATIC_DRAW);

  //FACES :
  var triangle_faces = [0,1,2];
  var TRIANGLE_FACES= GL.createBuffer ();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, TRIANGLE_FACES);
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(triangle_faces),
    GL.STATIC_DRAW);

  /*========================= MATRIX ========================= */

  var PROJMATRIX=LIBS.get_projection(40, CANVAS.width/CANVAS.height, 0.1, 10);
  var MOVEMATRIX=LIBS.get_I4();
  var MOVEMATRIX2=LIBS.get_I4();
  var VIEWMATRIX=LIBS.get_I4();

  LIBS.translateZ(VIEWMATRIX, -6);
  var THETA=0,
      PHI=0;
	  

 /*========================= THE SMOKE TEXTURE ========================= */

  var smokeImage=new Image();
  var smokeTexture=GL.createTexture();
  smokeImage.onload=function() {
    GL.activeTexture(GL.TEXTURE1);

    GL.bindTexture(GL.TEXTURE_2D, smokeTexture);

    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
    GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_LINEAR);

    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, smokeImage);
    GL.generateMipmap(GL.TEXTURE_2D);

    GL.activeTexture(GL.TEXTURE0);
  };
  smokeImage.src="ressources/smoke.png";

  /*========================= THE VIDEO TEXTURE ========================= */
  var video=document.getElementById("bunny_video");

  var videoTexture=GL.createTexture();
  GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
  GL.bindTexture(GL.TEXTURE_2D, videoTexture);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
  GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.LINEAR);


  GL.texParameteri( GL.TEXTURE_2D, GL.TEXTURE_WRAP_S, GL.CLAMP_TO_EDGE );
  GL.texParameteri( GL.TEXTURE_2D, GL.TEXTURE_WRAP_T, GL.CLAMP_TO_EDGE );

  var refresh_texture=function() {
    GL.bindTexture(GL.TEXTURE_2D, videoTexture);
    GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, video);
  };


  /*========================= DRAWING ========================= */
  //set WebGL states
  GL.enable(GL.DEPTH_TEST);
  GL.clearDepth(1.0);

  GL.clearColor(1.0, 1.0, 1.0, 1.0); //#2f83e0 in HTML notation

  //there is only 1 VBO -> we can put it out of the render loop
  GL.bindBuffer(GL.ARRAY_BUFFER, QUAD_VERTEX);
  GL.vertexAttribPointer(_position, 3, GL.FLOAT, false,4*(3+2),0) ;
  GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false,4*(3+2),3*4) ;
  

  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, QUAD_FACES);

  var time_old=0;
  var fps_time=0;
  var fps_frames=0;
  var dom_counter=document.getElementById("fps_counter");

  //the render loop :
  var animate=function(time) {
    var dt=(time-time_old)/1000;
    time_old=time;
	fps_time+=dt;
    fps_frames++;
   
   if (fps_time>1000) {

      var fps=1000 * fps_frames/fps_time;


      dom_counter.innerHTML=Math.round(fps) + " FPS";

      fps_time = fps_frames = 0;
	}

    if (!drag) {
      dX*=AMORTIZATION, dY*=AMORTIZATION;
      THETA+=dX, PHI+=dY;
	   THETA*=0.9;
      PHI*=0.9;
    }
    LIBS.set_I4(MOVEMATRIX);
    LIBS.rotateY(MOVEMATRIX, THETA);
    LIBS.rotateX(MOVEMATRIX, PHI);
	

    GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
    GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);

    if (video.currentTime>0 && video.currentTime!==time_video) {
      time_video=video.currentTime;
      refresh_texture();
    }

    PARTICLES.map(function(particle){
      GL.uniform3fv(_posParticle, particle.position);
      GL.uniform1f(_scaleParticle, particle.scale);

      GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);

      //compute the resultant force applied to the particle
      var Fm=[0,0.04/particle.density,0]; //specific force due to upthrust buoyancy

      var v2=LIBS.squareVec3(particle.speed);
      v2*=1; //apply a friction coefficient
      var vu=LIBS.get_unitVector(particle.speed);
      Fm[0]-=v2*vu[0],Fm[1]-=v2*vu[1],Fm[2]-=v2*vu[2]; //add air friction force

      //refresh speed using Newton second law
      particle.speed[0]+=dt*Fm[0],particle.speed[1]+=dt*Fm[1],particle.speed[2]+=dt*Fm[2];

      particle.position[0]+=dt*particle.speed[0],
        particle.position[1]-=dt*particle.speed[1],
        particle.position[2]+=dt*particle.speed[2];
		  
		
		 if (particle.position[1]<-4) reset_particle(particle);

    });
	

    GL.flush();
    window.requestAnimationFrame(animate);
  };
  animate(0);
};