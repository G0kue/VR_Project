
var main=function() {
  var CANVAS=document.getElementById("your_canvas");


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
    var EXT = GL.getExtension("OES_element_index_uint") ||
    GL.getExtension("MOZ_OES_element_index_uint") ||
    GL.getExtension("WEBKIT_OES_element_index_uint");
  } catch (e) {
    alert("You are not webgl compatible :(") ;
    return false;
  }

  /*========================= SHADERS ========================= */
  /*jshint multistr: true */

  var shader_vertex_source="\n\
attribute vec3 position;\n\
attribute vec3 normal;\n\
uniform mat4 Pmatrix;\n\
uniform mat4 Vmatrix;\n\
uniform mat4 Mmatrix;\n\
attribute vec2 uv;\n\
varying vec2 vUV;\n\
void main(void) { //pre-built function\n\
gl_PointSize=1.;\n\
gl_Position = Pmatrix*Vmatrix*Mmatrix*vec4(position, 1.);\n\
vUV=uv;\n\
}";

  var shader_fragment_source="\n\
precision mediump float;\n\
uniform sampler2D sampler;\n\
varying vec2 vUV;\n\
\n\
\n\
void main(void) {\n\
gl_FragColor = texture2D(sampler, vUV);\n\
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
  var _sampler = GL.getUniformLocation(SHADER_PROGRAM, "sampler");
  
  var _uv = GL.getAttribLocation(SHADER_PROGRAM, "uv");
  var _position = GL.getAttribLocation(SHADER_PROGRAM, "position");

  GL.enableVertexAttribArray(_uv);
  GL.enableVertexAttribArray(_position);
  //GL.enableVertexAttribArray(_normal);
  var shader_vertex_source_bg="attribute vec2 position_bg;\n\
varying vec2 vUV;\n\
void main(void) {\n\
gl_Position = vec4(position_bg, 1., 1.);\n\
vUV=0.5*(position_bg+vec2(1.,1.)); //vUV must be between 0 and 1;\n\
}";

  var shader_fragment_source_bg="\n\
precision mediump float;\n\
uniform sampler2D sampler;\n\
varying vec2 vUV;\n\
void main(void) {\n\
gl_FragColor = texture2D(sampler, vUV);\n\
}";

  var shader_vertex_bg=get_shader(shader_vertex_source_bg, GL.VERTEX_SHADER, "VERTEX_BG");
  var shader_fragment_bg=get_shader(shader_fragment_source_bg, GL.FRAGMENT_SHADER, "FRAGMENT_BG");

  var SHADER_PROGRAM_BG=GL.createProgram();
  GL.attachShader(SHADER_PROGRAM_BG, shader_vertex_bg);
  GL.attachShader(SHADER_PROGRAM_BG, shader_fragment_bg);

  GL.linkProgram(SHADER_PROGRAM_BG);

  var _sampler_bg = GL.getUniformLocation(SHADER_PROGRAM_BG, "sampler");
  var _position_bg = GL.getAttribLocation(SHADER_PROGRAM_BG, "position_bg");
  GL.enableVertexAttribArray(_position_bg);


  GL.useProgram(SHADER_PROGRAM);
  GL.uniform1i(_sampler, 0);


      /*========================= THE DRAGON 1 ========================= */

      var CUBE_VERTEX=false, CUBE_FACES=false, CUBE_NPOINTS=0;

      LIBS.get_json("ressources/dragon.json", function(dragon){
        //vertices
        CUBE_VERTEX= GL.createBuffer ();
        GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
        GL.bufferData(GL.ARRAY_BUFFER,
                new Float32Array(dragon.vertices),
                GL.STATIC_DRAW);

        //faces
        CUBE_FACES=GL.createBuffer ();
        GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
        GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
                new Uint32Array(dragon.indices),
                GL.STATIC_DRAW);

        CUBE_NPOINTS=dragon.indices.length;

        animate(0);

      });
	  
	    /*========================= THE DRAGON 2 ========================= */

   var CUBE_VERTEX1=false, CUBE_FACES1=false, CUBE_NPOINTS1=0;

  LIBS.get_json("ressources/dragon.json", function(dragon){
    //vertices
    CUBE_VERTEX1= GL.createBuffer ();
    GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX1);
    GL.bufferData(GL.ARRAY_BUFFER,
                  new Float32Array(dragon.vertices),
      GL.STATIC_DRAW);

    CUBE_FACES1=GL.createBuffer ();
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES1);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
                  new Uint32Array(dragon.indices),
      GL.STATIC_DRAW);

    CUBE_NPOINTS1=dragon.indices.length;

    animate(0);

  });
   /*========================= THE FLOOR ========================= */

  var floor_vertices=[
    -10,0,-10,   0,1,0,   0,0, //1st point position,normal and UV
    -10,0, 10,   0,1,0,   0,1, //2nd point
    10,0, 10,   0,1,0,   1,1,
    10,0,-10,   0,1,0,   1,0
  ];

  var FLOOR_VERTEX= GL.createBuffer ();
  GL.bindBuffer(GL.ARRAY_BUFFER, FLOOR_VERTEX);
  GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(floor_vertices), GL.STATIC_DRAW);

  var FLOOR_INDICES=GL.createBuffer ();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, FLOOR_INDICES);
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
                new Uint16Array([0,1,2, 0,2,3]),GL.STATIC_DRAW);
 /*========================= THE BACKGROUND PLANE ========================= */
  var BG_VERTEX= GL.createBuffer ();
  GL.bindBuffer(GL.ARRAY_BUFFER, BG_VERTEX);
  GL.bufferData(GL.ARRAY_BUFFER,
                new Float32Array([-1,1,   -1,-1,   1,-1,   1,1]),
    GL.STATIC_DRAW);

  var BG_FACES=GL.createBuffer ();
  GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, BG_FACES);
  GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
                new Uint16Array([0,1,2, 0,2,3]),
    GL.STATIC_DRAW);

  /*========================= MATRIX ========================= */

  var PROJMATRIX=LIBS.get_projection(40, CANVAS.width/CANVAS.height, 1, 100);
  var MOVEMATRIX=LIBS.get_I4();
  var VIEWMATRIX=LIBS.get_I4();
  var MOVEMATRIX2=LIBS.get_I4();
   var VIEWMATRIX2=LIBS.get_I4();
    var MOVEMATRIX3=LIBS.get_I4();
   var VIEWMATRIX3=LIBS.get_I4();

  LIBS.translateZ(VIEWMATRIX, -40);
  LIBS.translateY(VIEWMATRIX, -10);
   
  var THETA=1.5,
      PHI=0;
 LIBS.translateY(VIEWMATRIX2, 10);
	  var THETA2=0,
      PHI2=0;
	  
	  LIBS.translateY(VIEWMATRIX3, -10);
	  var THETA3=3,
      PHI3=0;
	 

  /*========================= TEXTURES ========================= */
  var get_texture=function(image_URL){


    var image=new Image();

    image.src=image_URL;
    image.webglTexture=false;


    image.onload=function(e) {
      var texture=GL.createTexture();
      GL.pixelStorei(GL.UNPACK_FLIP_Y_WEBGL, true);
      GL.bindTexture(GL.TEXTURE_2D, texture);
      GL.texImage2D(GL.TEXTURE_2D, 0, GL.RGBA, GL.RGBA, GL.UNSIGNED_BYTE, image);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MAG_FILTER, GL.LINEAR);
      GL.texParameteri(GL.TEXTURE_2D, GL.TEXTURE_MIN_FILTER, GL.NEAREST_MIPMAP_LINEAR);
      GL.generateMipmap(GL.TEXTURE_2D);
      GL.bindTexture(GL.TEXTURE_2D, null);
      image.webglTexture=texture;
    };

    return image;
  };

  var cube_texture=get_texture("ressources/dragon.png");
    var bg_texture=get_texture("ressources/background.png");
	  var floor_texture=get_texture("ressources/granit.jpg");



  /*========================= DRAWING ========================= */
  GL.enable(GL.DEPTH_TEST);
  GL.depthFunc(GL.LEQUAL);
  GL.clearColor(0.0, 0.0, 0.0, 0.0);
  GL.clearDepth(1.0);

  var time_old=0;
  var fps_time=0;
  var fps_frames=0;
  var dom_counter=document.getElementById("fps_counter");
  var animate=function(time) {
    var dt=time-time_old;
    if (!drag) {
      dX*=AMORTIZATION, dY*=AMORTIZATION;
      THETA+=dX, PHI+=dY;
    }
    LIBS.set_I4(MOVEMATRIX);
	LIBS.translateY(MOVEMATRIX, 3);
    LIBS.rotateY(MOVEMATRIX, THETA);
    LIBS.rotateX(MOVEMATRIX, PHI);
	

	LIBS.set_I4(MOVEMATRIX2);
	LIBS.translateY(MOVEMATRIX2, -10);
    LIBS.rotateY(MOVEMATRIX2, THETA2);
    LIBS.rotateX(MOVEMATRIX2, PHI2);
	
	LIBS.set_I4(MOVEMATRIX3);
	LIBS.translateY(MOVEMATRIX3, 14);
    LIBS.rotateY(MOVEMATRIX3, THETA3);
    LIBS.rotateX(MOVEMATRIX3, PHI3);

    time_old=time;
	fps_time+=dt;
    fps_frames++;
    if (fps_time>1000) {

      var fps=1000 * fps_frames/fps_time;


      dom_counter.innerHTML=Math.round(fps) + " FPS";

      fps_time = fps_frames = 0;
    }
	


    GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);
    GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
    GL.uniformMatrix4fv(_Pmatrix, false, PROJMATRIX);
    GL.uniformMatrix4fv(_Vmatrix, false, VIEWMATRIX);
    GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX);	
	
	
	
    if (cube_texture.webglTexture) {

      GL.activeTexture(GL.TEXTURE0);

      GL.bindTexture(GL.TEXTURE_2D, cube_texture.webglTexture);
    }
    
    GL.bindBuffer(GL.ARRAY_BUFFER, CUBE_VERTEX);
    GL.vertexAttribPointer(_position, 3, GL.FLOAT, false,4*(3+3+2),0) ;
    GL.vertexAttribPointer(_uv, 2, GL.FLOAT, false,4*(3+3+2),(3+3)*4) ;
    
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES);
    GL.drawElements(GL.TRIANGLES, CUBE_NPOINTS, GL.UNSIGNED_INT, 0);
	
    GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX2);

	
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES1);
    GL.drawElements(GL.POINTS, CUBE_NPOINTS, GL.UNSIGNED_INT, 0);
	
	GL.uniformMatrix4fv(_Mmatrix, false, MOVEMATRIX3);

	
   GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, CUBE_FACES1);
    GL.drawElements(GL.POINTS, CUBE_NPOINTS, GL.UNSIGNED_INT, 0);
	
	
	
    //DRAW THE FLOOR
  

    

	

    GL.flush();
    window.requestAnimationFrame(animate);
  };
};