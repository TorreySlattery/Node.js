var maze = [];
for (var row=0; row<15; row++){
  var thisRow = [];
  for (var col=0; col<25; col++){
    thisRow.push(0); //To initialize an empty 25x15 array
  }
  maze.push(thisRow);
}

var static2d = [];

for (var row=0; row<15; row++){
  var thisRow = [];
  for (var col=0; col<25; col++){
    thisRow.push(0); //To initialize an empty 25x15 array
  }
  static2d.push(thisRow);
}

function carve_passages_from(cx, cy, grid){
  var directions = [1, 2, 3, 4]; //N, E, S, W
  directions = shuffle(directions);
  for (var i=0; i<4; i++){
    var nx = cx;
    var ny = cy;

    switch(directions[i]){
      case 1: //North
        ny--;
        ny--;
        break;
      case 2: //East
        nx++;
        nx++;
        break;
      case 3: //South
        ny++;
        ny++;
        break;
      case 4: //West
        nx--;
        nx--;
        break;
    }

    var opposite = [directions[2], directions[3], directions[0], directions[1]];

    if((0 <= ny) && (ny <= grid.length-1) && (0 <= nx) && (nx <= grid[0].length-1) && (grid[ny][nx] == 0)){
      //Cell is valid
      grid[cy][cx] = directions[i]; //mark which way we went that was valid

      switch(directions[i]){
        case 1: //North
          grid[cy-1][cx] = directions[i];
          break;
        case 2: //East
          grid[cy][cx+1] = directions[i];
          break;
        case 3: //South
          grid[cy+1][cx] = directions[i];
          break;
        case 4: //West
          grid[cy][cx-1] = directions[i];
          break;
      }

      grid[ny][nx] = opposite[i]; //mark which way we came from

      carve_passages_from(nx, ny, grid);
    }
  }
}

function parseMaze(maze){
  for(var i=0; i<maze.length; i++){
    for(var k=0; k<maze[0].length; k++){
      if(maze[i][k]==0){
        maze[i][k] = 5;
      }else{
        maze[i][k] = 0;
      }
    }
  }
}

//Pretty clearly not my code. From Stack Overflow:
function shuffle(array){
  var counter = array.length, temp, index;

  while (counter > 0){
    index = Math.floor(Math.random() * counter);

    counter--;

    temp = array[counter];
    array[counter] = array[index];
    array[index] = temp;
  }
  return array;
}