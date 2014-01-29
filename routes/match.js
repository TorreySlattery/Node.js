module.exports = function Match(app){

  var maze = require('../public/javascripts/maze_s.js')

  lobbyUsers = {};
  games = {};
  belongs_to = {}; //I trid storing which game each user belongs to in their session variable, but it wasn't being preserved between page redirects
  checkins = {}; //gameID: players_checked_in

  app.io.route('joined_lobby', function(req){
    console.log(req.data.email + " joined the lobby.");
    req.io.join('lobby')
    lobbyUsers[req.data.email] = req.data.email
    req.io.emit('show_current_games', games);
  });

  app.io.route('create_game_for', function(req){
    console.log("New game requested for user: ", req.data);

    games[req.data.email] = req.data
    belongs_to[req.data.email] = req.data.email
    req.io.join(req.data.email)
    req.io.room('lobby').broadcast('new_game_waiting', games)
    req.io.emit('new_game_ack', req.session);
  });

  app.io.route('i_want_to_join', function(req){
    console.log("Join game requested: ", req.data);
    belongs_to[req.data.iam.email] = req.data.gameID
    req.io.join(req.data.gameID);
    req.io.room(req.data.gameID).broadcast('game_matched', req.data.iam);
    app.io.room(req.data.gameID).broadcast('go_play', req.data.gameID)
  });

  app.io.route('checking_in', function(req){
    console.log("User checking in after page redirect.")
    console.log("Belongs to: ", belongs_to[req.data.email])
    var gameID = belongs_to[req.data.email]

    req.io.join(gameID)
    req.io.emit('checking_in_ack')

    if(checkins[gameID]){
      console.log("Both users checked in for gameID: " + gameID + ". Server generating a maze to send to the clients.")
      var x = Math.floor(Math.random()*24)
      var y = Math.floor(Math.random()*14)
      var map = maze.generateMaze(x, y)

      req.io.room(gameID).broadcast('you_are_player1', map)
      req.io.emit('you_are_player2', map)
    }else{
      console.log("First user checked in.")
      checkins[gameID] = 1
    }
  });

  app.io.route("created_a_bullet", function(req){
    var gameID = belongs_to[req.session.email]
    if(gameID){
      req.io.room(gameID).broadcast('bullet_created', req.data);
    }
  });

  app.io.route("my_current_position", function(req){
    var gameID = belongs_to[req.session.email]
    if(gameID){
      req.io.room(gameID).broadcast('update_your_enemy', req.data)
    }
  });

  app.io.route('disconnect', function(req){
    delete lobbyUsers[req.sessionID];
    app.io.room('lobby').broadcast('user_left_lobby', {
      usersInLobby: lobbyUsers
    });
  });
}