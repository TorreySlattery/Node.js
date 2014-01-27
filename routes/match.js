module.exports = function Match(app){

  var games = {};
  var lobbyUsers ={};

  function Game(id){
    this.id = id;
    this.players = 1
  }

  app.io.route('join_lobby', function(req){
    req.io.join('lobby');
    lobbyUsers[req.sessionID] = req.sessionID;

    app.io.room('lobby').broadcast('user_joined_lobby', {
      usersInLobby: lobbyUsers
    })
  });

  //User clicks the "Create Game" button
  app.io.route('create_game', function(req){

    // var game = new Game(req.data.id)

    // if(games[game.id]){
    //   console.log("Game name was in use already.");
    //   req.io.emit('pick_a_new_name', {});
    // }else{
    //   console.log("Creating a new game...");
    //   games[game.id]  = game
    //   req.io.join(game.id);
    //   //Todo: on success, send the user to Play with a "Waiting for players to join..." message and an option to cancel.
    //   req.io.room('lobby').broadcast('new_game_created', {
    //     req.data.id: req.data.id
    //   });
    // }

    var game = new Game(req.sessionID)
    console.log("New game requested for sessionID: ", game.id)

    if(games[game.id]){
      console.log("Game name was in use already.");
      req.io.emit('pick_a_new_name', {});
    }else{
      console.log("Creating a new game...");
      games[game.id]  = game.id
      req.io.join(game.id);
      //Todo: on success, send the user to Play with a "Waiting for players to join..." message and an option to cancel.
      req.io.room('lobby').broadcast('new_game_created', game.id);
      app.io.room('lobby').broadcast('update_your_users', games);
    }

  });

  app.io.route('join_game', function(req){
    
    if(games[req.data.id].players <2){
      games[req.data.id].players++;
      console.log("Joining room: ", games[req.data.id]);
      req.io.join(req.data.id)
      app.io.room('lobby').broadcast('game_filled', {
        id: req.data.id
      });
      req.io.room(req.data.id).broadcast('game_room_ready', {});
    }else{
      console.log("User was too slow to join room: ", games[req.data.id]);
      req.io.emit('too_slow', {});
    }
  });

  app.io.route('disconnect', function(req){
    // lobbyUsers[req.sessionID] = false;
    delete lobbyUsers[req.sessionID];
    app.io.room('lobby').broadcast('user_left_lobby', {
      usersInLobby: lobbyUsers
    });
  });
}