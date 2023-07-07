
var state = {
    ui: {
      dragging: false,
      mouse: {
        lastX: -1,
        lastY: -1,
      },
      pressedKeys: {},
      mode: 'svm',
    },
    animation: {},
    app: {
      angle: {
        x: 0,
        y: 0,
      },
      eye: {
        x:2.,
        y:2.,
        z:7.,
      },
    },
  };
async function main(video, alphas, carTex, alphaTVs, icons) {
    // Get A WebGL context
    /** @type {HTMLCanvasElement} */
      const canvas = document.querySelector("#canvas");
      const gl = canvas.getContext("webgl", {  premultipliedAlpha: false});
      if (!gl) {
          return;
      }

      const canvasTV = document.querySelector("#canvas1");
      const glTV = canvasTV.getContext("webgl", {  premultipliedAlpha: false});
      if (!glTV) {
          return;
      }
      
    state.canvas = canvas;  
    canvas.onmousedown = mousedown;
    canvas.onmouseup = mouseup;
    canvas.onmousemove = mousemove;
  //  canvas.addEventListener("touchstart", mousedown, {passive: false});
  //  canvas.addEventListener("touchend", mouseup);
  // //  canvas.addEventListener("touchcancel", handleCancel);
  //  canvas.addEventListener("touchmove", mousemove);
      const vs = await (await fetch('shader/vertexShader2.glsl')).text()
      const fs = await (await fetch('shader/fragmentShader2.glsl')).text()
      
      const vsCar = await (await fetch('shader/vertexShaderCar.glsl')).text()
      const fsCar = await (await fetch('shader/fragmentShaderCar.glsl')).text()
      
      // Log Car State
      const carStateText = await (await fetch('video/video_in.txt')).text()
      const carState = getCarState(carStateText);
      // Tire view
      const frontLeftViewReq = await (await fetch('obj/tire_views/frontLeftWheelView3DMesh.txt')).text()
      const frontLeftView = frontLeftViewReq.split(/\n+|\s+/).map(parseFloat);
      frontLeftView.pop();
      const frontLeftViewUVReq = await (await fetch('obj/tire_views/frontLeftWheelViewUV.txt')).text()
      const frontLeftViewUV = frontLeftViewUVReq.split(/\n+|\s+/).map(parseFloat);
      frontLeftViewUV.pop();

      const frontRightViewReq = await (await fetch('obj/tire_views/frontRightWheelView3DMesh.txt')).text()
      const frontRightView = frontRightViewReq.split(/\n+|\s+/).map(parseFloat);
      frontRightView.pop();
      const frontRightViewUVReq = await (await fetch('obj/tire_views/frontRightWheelViewUV.txt')).text()
      const frontRightViewUV = frontRightViewUVReq.split(/\n+|\s+/).map(parseFloat);
      frontRightViewUV.pop();

      const rearLeftViewReq = await (await fetch('obj/tire_views/rearLeftWheelView3DMesh.txt')).text()
      const rearLeftView = rearLeftViewReq.split(/\n+|\s+/).map(parseFloat);
      rearLeftView.pop();
      const rearLeftViewUVReq = await (await fetch('obj/tire_views/rearLeftWheelViewUV.txt')).text()
      const rearLeftViewUV = rearLeftViewUVReq.split(/\n+|\s+/).map(parseFloat);
      rearLeftViewUV.pop();

      const rearRightViewReq = await (await fetch('obj/tire_views/rearRightWheelView3DMesh.txt')).text()
      const rearRightView = rearRightViewReq.split(/\n+|\s+/).map(parseFloat);
      rearRightView.pop();
      const rearRightViewUVReq = await (await fetch('obj/tire_views/rearRightWheelViewUV.txt')).text()
      const rearRightViewUV = rearRightViewUVReq.split(/\n+|\s+/).map(parseFloat);
      rearRightViewUV.pop();
      // Single View
      const leftViewReq = await (await fetch('obj/views/leftView3DMesh.txt')).text()
      const leftView = leftViewReq.split(/\n+|\s+/).map(parseFloat);
      const leftViewUVReq = await (await fetch('obj/views/leftViewUV.txt')).text()
      const leftViewUV = leftViewUVReq.split(/\n+|\s+/).map(parseFloat);
      leftView.pop()
      leftViewUV.pop()

      const frontViewReq = await (await fetch('obj/views/frontView3DMesh.txt')).text()
      const frontView = frontViewReq.split(/\n+|\s+/).map(parseFloat);
      const frontViewUVReq = await (await fetch('obj/views/frontViewUV.txt')).text()
      const frontViewUV = frontViewUVReq.split(/\n+|\s+/).map(parseFloat);
      frontView.pop()
      frontViewUV.pop()

      const rearViewReq = await (await fetch('obj/views/rearView3DMesh.txt')).text()
      const rearView = rearViewReq.split(/\n+|\s+/).map(parseFloat);
      const rearViewUVReq = await (await fetch('obj/views/rearViewUV.txt')).text()
      const rearViewUV = rearViewUVReq.split(/\n+|\s+/).map(parseFloat);
      rearView.pop()
      rearViewUV.pop()

      const rightViewReq = await (await fetch('obj/views/rightView3DMesh.txt')).text()
      const rightView = rightViewReq.split(/\n+|\s+/).map(parseFloat);
      const rightViewUVReq = await (await fetch('obj/views/rightViewUV.txt')).text()
      const rightViewUV = rightViewUVReq.split(/\n+|\s+/).map(parseFloat);
      rightView.pop()
      rightViewUV.pop()

      // Top view
      const calibCam0TVReq = await fetch('obj/calib_cam0_topview.txt');  
      const calibCam0TVText = await calibCam0TVReq.text();
      const calibCam0TV = calibCam0TVText.split(/\n+|\s+/).map(parseFloat);
  
      const calibCam1TVReq = await fetch('obj/calib_cam1_topview.txt');  
      const calibCam1TVText = await calibCam1TVReq.text();
      const calibCam1TV = calibCam1TVText.split(/\n+|\s+/).map(parseFloat);
  
      const calibCam2TVReq = await fetch('obj/calib_cam2_topview.txt');  
      const calibCam2TVText = await calibCam2TVReq.text();
      const calibCam2TV = calibCam2TVText.split(/\n+|\s+/).map(parseFloat);
  
      const calibCam3TVReq = await fetch('obj/calib_cam3_topview.txt');  
      const calibCam3TVText = await calibCam3TVReq.text();
      const calibCam3TV = calibCam3TVText.split(/\n+|\s+/).map(parseFloat);
      // SVM
      const calibCam0Req = await fetch('obj/scalib/calib_cam0.txt');  
      const calibCam0Text = await calibCam0Req.text();
      const calibCam0 = calibCam0Text.split(/\n+|\s+/).map(parseFloat);
  
      const calibCam1Req = await fetch('obj/scalib/calib_cam1.txt');  
      const calibCam1Text = await calibCam1Req.text();
      const calibCam1 = calibCam1Text.split(/\n+|\s+/).map(parseFloat);
  
      const calibCam2Req = await fetch('obj/scalib/calib_cam2.txt');  
      const calibCam2Text = await calibCam2Req.text();
      const calibCam2 = calibCam2Text.split(/\n+|\s+/).map(parseFloat);
  
      const calibCam3Req = await fetch('obj/scalib/calib_cam3.txt');  
      const calibCam3Text = await calibCam3Req.text();
      const calibCam3 = calibCam3Text.split(/\n+|\s+/).map(parseFloat);
  
      const responseSVM = await fetch('obj/Elipsesphere.obj');  
      const textSVM = await responseSVM.text();
      
      const objsvm = parser(textSVM)

      const responseTV = await fetch('obj/bowl_topview.obj');  
      const textTV = await responseTV.text();
      
      const objTV = parser(textTV)
      
      const visitor = new GLParseVisitor();
      // 0: postion 1: color 2: normals 3: texcoord
      const extractArrayTV = visitor.visit(objTV)[0];
      const extractArray = visitor.visit(objsvm)[0];
      
      const svmtview = new TopViewLoading(
        glTV, 
        canvasTV, 
        video, 
        alphaTVs, 
        extractArrayTV,
        [calibCam0TV, calibCam1TV, calibCam2TV, calibCam3TV], 
        vs, 
        fs,
        )
        
      const svm = new SurroundingViewLoading(
        gl, 
        canvas, 
        video, 
        alphas, 
        extractArray,
        [calibCam0, calibCam1, calibCam2, calibCam3], 
        vs, 
        fs,)
      // Car
      const responseCar = await fetch('obj/Car_Body.obj');  
      const textCar = await responseCar.text();
      const carobj = parser(textCar)
      const carVisitor = new GLParseVisitor();
      // 0: postion 1: color 2: normals 3: texcoord
      const  extractCarArray = carVisitor.visit(carobj)[0];

     
      const responseWheelFL = await fetch('obj/wheels/wheel_front_left.obj');  
      const textWheelFL = await responseWheelFL.text();
      const wheelFLobj = parser(textWheelFL)
      const  extractWheelFL = carVisitor.visit(wheelFLobj)[0];

      const responseWheelFR = await fetch('obj/wheels/wheel_front_right.obj');  
      const textWheelFR = await responseWheelFR.text();
      const wheelFRobj = parser(textWheelFR)
      const  extractWheelFR = carVisitor.visit(wheelFRobj)[0];
      
      const responseWheelRL = await fetch('obj/wheels/wheel_rear_left.obj');  
      const textWheelRL = await responseWheelRL.text();
      const wheelRLobj = parser(textWheelRL)
      const  extractWheelRL = carVisitor.visit(wheelRLobj)[0];

      const responseWheelRR = await fetch('obj/wheels/wheel_rear_right.obj');  
      const textWheelRR = await responseWheelRR.text();
      const wheelRRobj = parser(textWheelRR)
      const  extractWheelRR = carVisitor.visit(wheelRRobj)[0];
      // Init
      const carTV = new CarViewLoading(
          glTV,
          canvasTV,
          carTex,
          extractCarArray,
          vsCar,
          fsCar,
          0.6,
          'topview',
      )
      const carSVM = new CarViewLoading(
          gl,
          canvas,
          carTex,
          extractCarArray,
          vsCar,
          fsCar,
          0.61,
          'surrounding',
          [extractWheelFL, extractWheelFR, extractWheelRL, extractWheelRR]
      )
      const singleViewLoading = new LoadScene(gl, canvas, video, 
                                            [leftView, frontView, rearView, rightView],
                                            [leftViewUV, frontViewUV, rearViewUV, rightViewUV]
                                            );
     
      const tireViewLoading = new LoadSceneTire(gl, canvas, video, 
                                            [frontLeftView, frontRightView, rearLeftView, rearRightView], 
                                            [frontLeftViewUV,  frontRightViewUV, rearLeftViewUV, rearRightViewUV], 
                                            1
                                            );
      // const button1 = new Button(
      //   glTV,
      //   canvasTV,
      //   icons[0],
      // )
      
      // const button2 = new Button(
      //   glTV,
      //   canvasTV,
      //   icons[1],
      // )
      let frames = carState.next().value;
      let duration = video.duration;
      let fps = 35;
      let carStateUpdate = carState.next().value;;
      
      let defaultTimeStamp = carStateUpdate;
      let time = 0.01
      let start = false;
      function render() {
        if (video.currentTime == 0) {
          // console.log("YEs")
          carStateUpdate = defaultTimeStamp;
        }
        
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

            svmtview.render(
                [-90,-180,0], 
                88
            )
            carTV.render(
                [-90, -180, 0],
                78
              )
            // button1.render(
            //   [0.1,.1,1],
            //   [-8,-8,0],
            //   [0,0,0],
            //   90
            // )
            // button2.render(
            //   [0.1,.1,1],
            //   [-4,-8,0],
            //   [0,0,0],
            //   90
            // )
           
          if (state.ui.mode == 'svm') {
            svm.render(
              [state.app.angle.x, state.app.angle.y, 0],
              // [0,0,0],
              37.5
            )
            carSVM.render(
              [state.app.angle.x, state.app.angle.y, 0],
              // [0,0,0],
              36,
              carStateUpdate,
            )
          }
          else
          if (state.ui.mode.split(' ')[0] != 'tire') {
            singleViewLoading.render(
              
              [0, 0, 0],
              
              60,
              state.ui.mode
              )
              
              
            } else
            {
              
              tireViewLoading.render(
                [0, 0, 0],
                
                60,
                state.ui.mode.split(' ')[1]
                )
            }
              
            while (video.currentTime*1000 > (carStateUpdate[0] - defaultTimeStamp[0]))
               carStateUpdate = carState.next().value;
            
            
            if (carStateUpdate)
              setTimeout(() => {
                requestAnimationFrame(render);
              }, 1000/fps);
            
           
      }
      requestAnimationFrame(render);
  }
  
  loadVideoAndImages(
    "video/video_in.mp4", 
    ['obj/scalib/alpha_0.png', 'obj/scalib/alpha_1.png', 'obj/scalib/alpha_2.png', 'obj/scalib/alpha_3.png'], 'obj/Car_Tex_Gray.bmp', 
    ['obj/alpha/alpha_TV_0.png', 'obj/alpha/alpha_TV_1.png', 'obj/alpha/alpha_TV_2.png', 'obj/alpha/alpha_TV_3.png'], 
    ['img/fronticon.png', 'img/rearicon.png'],
    main
  )


  function keydown(event) {
    state.ui.pressedKeys[event.keyCode] = true;
  }

  function keyup(event) {
    state.ui.pressedKeys[event.keyCode] = false;
  }


  function mousedown(event) {
    console.log("Start drag")
    var x = event.clientX;
    var y = event.clientY;
    var rect = event.target.getBoundingClientRect();
    // If we're within the rectangle, mouse is down within canvas.
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
      state.ui.mouse.lastX = x;
      state.ui.mouse.lastY = y;
      state.ui.dragging = true;
    }
  }

  function mouseup(event) {
    console.log("Stop drag")
    state.ui.dragging = false;
  }

  function mousemove(event) {
      var x = event.clientX;
      var y = event.clientY;
      if (state.ui.dragging) {
        console.log("Moving")
      // The rotation speed factor
      // dx and dy here are how for in the x or y direction the mouse moved
      var factor = 2;
      var dx = factor * (x - state.ui.mouse.lastX);
      var dy = factor * (y - state.ui.mouse.lastY);

      // update the latest angle
      if (state.app.angle.x - dy >= -5 && state.app.angle.x - dy <= 50) {
            state.app.angle.x = state.app.angle.x - dy;
      }
      
        state.app.angle.y = state.app.angle.y - dx;
    }
    // update the last mouse position
    state.ui.mouse.lastX = x;
    state.ui.mouse.lastY = y;
  }
  $("#btn1").on("click", (e) => {
   
    state.ui.mode = 'svm';
  
  });
  $("#btn2").on("click", (e) => {
    state.ui.mode = 'front';
  
  });

  $("#btn3").on("click", (e) => {
    state.ui.mode = 'rear';
  
  });

  $("#btn4").on("click", (e) => {
    state.ui.mode = 'left';
  
  });
  $("#btn5").on("click", (e) => {
    state.ui.mode = 'right';
  
  });
  $("#btn6").on("click", (e) => {
    state.ui.mode = 'tire front';
  
  });
  $("#btn7").on("click", (e) => {
    state.ui.mode = 'tire rear';
  
  });

