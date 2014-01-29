$.getScript("/socket.io/socket.io.js", function(){

  //TODO: Collision detection with bullets. If player collides with one, emit defeat, game ends for both parties.

  //This hurts my soul to use a global.
  window.addBullet = function(otherPlayer){
    if(otherPlayer.signature && otherPlayer.signature != "player1"){
      createBullet(otherPlayer);
    }
  }

  window.updateEnemy = function(otherPlayer){
    if(otherPlayer.signature && otherPlayer.signature != "player1"){
      updateEnemy(otherPlayer)
    }
  }

  io = io.connect()

  var lastTime;
  var c = document.getElementById("myCanvas");
  var ctx = c.getContext('2d')

  var keysDown = {};
  var animateDrawables = {};
  var static2d = [];
  var bullets = []

  var lastGoodX;
  var lastGoodY;

  var sm = new SpriteManager(ctx)
  var pattern;


  function SpriteManager(ctx){
    var sprites = {}; 

    this.load = function(name, url){
      var img = new Image();
      img.src = url;
      img.onload = function(){
        sprites[name] = img;
      }
    }

    this.draw = function(name, x, y){
      if(typeof sprites[name] !== 'undefined'){
        ctx.drawImage(sprites[name], x, y);
      }
    }
  }

  (function(){
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.rect(0, 0, c.width, c.height);

    var background = new Image();
    background.src = ('/images/grass.jpg');
    background.onload = function(){
      pattern = ctx.createPattern(background, 'repeat');
      ctx.fillStyle = pattern;
    }

    sm.load('tree', '/images/tree.png');

    sm.load('player1_n', '/images/player1_n.png');
    sm.load('player1_e', '/images/player1_e.png');
    sm.load('player1_s', '/images/player1_s.png');
    sm.load('player1_w', '/images/player1_w.png');

    sm.load('player2_n', '/images/player2_n.png');
    sm.load('player2_e', '/images/player2_e.png');
    sm.load('player2_s', '/images/player2_s.png');
    sm.load('player2_w', '/images/player2_w.png');

    sm.load('bullet_n', '/images/bullet_n.png');
    sm.load('bullet_e', '/images/bullet_e.png');
    sm.load('bullet_s', '/images/bullet_s.png');
    sm.load('bullet_w', '/images/bullet_w.png');

    $("#myCanvas").keydown(function(e){
      keysDown[e.keyCode] = true;
    });

    $("#myCanvas").keyup(function(e){
      delete keysDown[e.keyCode];
    });

    $("#myCanvas").focus();

    $("#myCanvas").keypress(function(e){
      var keycode = e.charCode || e.keyCode;
      if(keycode == 32){
        var player = animateDrawables['player1']
        player.signature = "player1"
        createBullet(player);
        io.emit('created_a_bullet', player)
        e.preventDefault();
      }
    });

    for (var row=0; row<15; row++){
    var thisRow = [];
    for (var col=0; col<25; col++){
      thisRow.push(0); //To initialize an empty 25x15 array
    }
    static2d.push(thisRow);
  }

    init();
  }())

  function init(){
    function findSpawnPoint(){
      for (var i=0; i<maze.length; i++){
        for (var k=0; k<maze[0].length; k++){
          if(maze[i][k] != 5){
            lastGoodX = k * 40;
            lastGoodY = i * 40;

            return;
          }
        }
      }
    }

    findSpawnPoint()

    addDrawables('player1_n', lastGoodX, lastGoodY, 24, 24,'player1');

    var spacingX = Math.floor(c.width / maze[0].length);
    var spacingY = Math.floor(c.height / maze.length);

    for (var i=0; i<maze.length; i++){
      for (var k=0; k<maze[0].length; k++){
        switch(maze[i][k]){ //in case we want more than one barrier type
          case 5:
            add2dStatic('tree', k*spacingX, i*spacingY, 40, 40, i, k);
            break;
        }
      }
    }

    requestAnimationFrame(update);
  }

  function add2dStatic(name, x, y, width, height, indexX, indexY){
    static2d[indexX][indexY] = {name: name,
                                x: x,
                                y: y,
                                width: width,
                                height: height
    };
  }

  function addDrawables(name, x, y, width, height, refName, collection, direction){
    var myList = typeof collection !== 'undefined' ? collection : animateDrawables;
    var myDirection = typeof direction !== 'undefined' ? direction : 1;
    myList[refName] = {
                                  name: name,
                                  x: x,
                                  y: y,
                                  width: width,
                                  height: height,
                                  image: name,//Default, but changes for animations
                                  intersects: function(collidable){
                                            //If A's left edge is to the right of B's right
                                    return !(this.x >= collidable.x+collidable.width ||
                                            //If A's right edge is to the left of B's left
                                            this.x+this.width <= collidable.x ||
                                            //If A's top is below B's bottom
                                            this.y >= collidable.y+collidable.height ||
                                            //If A's bottom is above B's top
                                            this.y+this.height <= collidable.y);
                                  },
                                  dir: myDirection, //1N 2E 3S 4W
                                  //Animation TODO
                                  //anim: arrayOfStringNames,
                                  //animIndex: 0,
                                  //animStepSize: 1.0
                                }
  }

  function update(){
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;
    lastTime = now;

    handleUserInput(dt);
    moveBullets(dt);
    checkBorders(animateDrawables['player1']);
    if(checkStaticCollisions(animateDrawables['player1'])){
      resetPlayerPosition();
    }

    for (var k in bullets){
      if(checkBorders(bullets[k])){
        delete bullets[k];
      }else{
        var collidedWith = checkStaticCollisions(bullets[k]);
        if(collidedWith){
          delete bullets[k];
          static2d[collidedWith[0]][collidedWith[1]] = 0;
        }
      }
    }

    draw();

    requestAnimationFrame(update);
  }

  function handleUserInput(deltaTime){
    var step = deltaTime * 128;

    var player = animateDrawables['player1'];
    player.signature = "player1"

    if (87 in keysDown){ //W
      if(!checkBorders(player, 0, -step)){
        lastGoodY = player['y'];
        player['y'] -= step;
        player['dir'] = 1;
        player['image'] = 'player1_n';
        
        io.emit('my_current_position', player)
      }
    }

    if (65 in keysDown){ //A
      if(!checkBorders(player, -step, 0)){
        lastGoodX = player['x'];
        player['x'] -= step;
        player['dir'] = 4;
        player['image'] = 'player1_w';

        io.emit('my_current_position', player)
      }
    }

    if (83 in keysDown){ //S
      //Hard-coded avatar size. Kind of... awful, but eh.
      if(!checkBorders(player, 0, step+player['height'])){
        lastGoodY = player['y'];
        player['y'] += step;
        player['dir'] = 3;
        player['image'] = 'player1_s';

        io.emit('my_current_position', player)
      }
    }

    if (68 in keysDown){ //D
      if(!checkBorders(player, step+player['width'], 0)){
        lastGoodX = player['x'];
        player['x'] += step;
        player['dir'] = 2;
        player['image'] = 'player1_e';

        io.emit('my_current_position', player)
      }
    }
  }

  function moveBullets(deltaTime){
    var step = deltaTime * 256;
    for (var k in bullets){
      switch(bullets[k]['dir']){
        case 1://heading north
          bullets[k]['y'] -= step;
          break;
        case 2://heading east
          bullets[k]['x'] += step;
          break;
        case 3://heading south
          bullets[k]['y'] += step;
          break;
        case 4://heading west
          bullets[k]['x'] -= step;
          break;
      }
    }
  }

  function updateEnemy(otherPlayer){
    if(!animateDrawables['player2']){
      addDrawables(otherPlayer.name, otherPlayer.x, otherPlayer.y, otherPlayer.width, otherPlayer.height, 'player2')
    }else{

      var myEnemy = animateDrawables['player2']
      myEnemy['x'] = otherPlayer.x
      myEnemy['y'] = otherPlayer.y
      myEnemy['dir'] = otherPlayer.dir
      myEnemy['image'] = otherPlayer.image
    }
  }

  function createBullet(player){
    var randName = "bullet" + Math.random();
    var x;
    var y;

    var bulletWidth = 16;
    var bulletHeight = 16;

    switch(player.dir){
      case 1:
        x = player.x + player.width/2 - bulletWidth/2;
        y = player.y;
        addDrawables('bullet_n', 
              x, 
              y, 
              bulletWidth, 
              bulletHeight,
              randName,
              bullets,
              player.dir);
        break;
      case 2:
        x = player.x + player.width;
        y = player.y + player.height/2 - bulletHeight/2;
        addDrawables('bullet_e', 
              x, 
              y, 
              bulletWidth, 
              bulletHeight,
              randName,
              bullets,
              player.dir);
        break;
      case 3:
        x = player.x + player.width/2 - bulletWidth/2;
        y = player.y + player.height;
        addDrawables('bullet_s', 
              x, 
              y, 
              bulletWidth, 
              bulletHeight,
              randName,
              bullets,
              player.dir);
        break;
      case 4:
        x = player.x;
        y = player.y + player.height/2 - bulletHeight/2;
        addDrawables('bullet_w', 
              x, 
              y, 
              bulletWidth, 
              bulletHeight,
              randName,
              bullets,
              player.dir);
        break;
    }
  }

  function resetPlayerPosition(){
    animateDrawables['player1']['x'] = lastGoodX;
    animateDrawables['player1']['y'] = lastGoodY;
  }

  function checkBorders(collidable, potentialX, potentialY){
    var px = typeof potentialX !== 'undefined' ? potentialX : 0;
    var py = typeof potentialY !== 'undefined' ? potentialY : 0;

    var x = collidable.x + px;
    var y = collidable.y + py;

    if(x<0 || x>1000 || y<0 || y>600){ //bounds of the canvas
      return true;
    } 

    return false;
  }

  function checkStaticCollisions(collidable){
    var rect = contains(static2d, 0, 0, static2d[0].length-1, static2d.length-1, collidable);

    for (var x=rect.startX; x<rect.endX+1; x++){
      for (var y=rect.startY; y<rect.endY+1; y++){
        count++;
        if(static2d[y][x]){
          if(collidable.intersects(static2d[y][x])){
            var coords = [y,x]
            return coords;
          }
        }
      }
    }
    return false;
  }

  function draw(){
    drawBG();

    for (var i in static2d){
      for (var k in static2d[i]){
        sm.draw(static2d[i][k]['name'], static2d[i][k]['x'], static2d[i][k]['y']);
      }
    }

    for (var k in animateDrawables){
      sm.draw(animateDrawables[k]['image'], animateDrawables[k]['x'], animateDrawables[k]['y']);
    }

    for (var k in bullets){
      sm.draw(bullets[k]['name'], bullets[k]['x'], bullets[k]['y']);
    }
  }

  function drawBG(){
    if(pattern){
      ctx.fill();
    }
  }
})