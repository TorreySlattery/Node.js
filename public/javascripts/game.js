$(document).ready(function(){

  var lastTime;
  var c = document.getElementById("myCanvas");
  var ctx = c.getContext('2d');
  var keysDown = {};

  function Drawable(image){
    this.moveSpeed = 0;
    this.posX = 0;
    this.posY = 0;
    this.image = image;
    this.direction = 0; //0N, 1E, 2S, 3W
  }

  var drawables = [];

  var pattern;

  function initialize(){
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.rect(0, 0, c.width, c.height);

    var background = new Image();
    background.src = ('/images/grass.jpg');
    background.onload = function(){
      pattern = ctx.createPattern(background, 'repeat');
      ctx.fillStyle = pattern;
      ctx.fill();
    }

    var player1 = new Image();
    player1.src = ('/images/sample1.jpg');
    player1.onload = function(){
      drawables['player1'] = new Drawable(player1);
      drawables['player1'].moveSpeed = 256;
      drawables['player1'].posX = 0;
      drawables['player1'].posY = 0;
    }

    $("#myCanvas").keydown(function(e){
      keysDown[e.keyCode] = true;
    });

    $("#myCanvas").keyup(function(e){
      delete keysDown[e.keyCode];
    });

    $("#myCanvas").focus();

    requestAnimationFrame(update);
  }

  function update(){
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;
    lastTime = now;

    handleUserInput(dt);
    draw();
    requestAnimationFrame(update);
  }

  function handleUserInput(deltaTime){
    if (87 in keysDown){ //W
      drawables['player1'].posY -= deltaTime * 256;
    }

    if (65 in keysDown){ //A
      drawables['player1'].posX -= deltaTime * 256;
    }

    if (83 in keysDown){ //S
      drawables['player1'].posY += deltaTime * 256;
    }

    if (68 in keysDown){ //D
      drawables['player1'].posX += deltaTime * 256;
    }

  }

  function draw(){
    drawBG();
    if(drawables['player1']){
      for (var k in drawables){
        ctx.drawImage(drawables[k].image, drawables[k].posX, drawables[k].posY);
      }
    }
  }

  function drawBG(){
    if(pattern){
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.rect(0, 0, c.width, c.height);
      ctx.fillStyle = pattern;
      ctx.fill();
    }
  }

  initialize();
});