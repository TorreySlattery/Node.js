var express = require('express.io');
var path = require('path');
var flash = require('connect-flash');
var app = express().http().io();

// configuring our environments
app.configure(function(){
  app.use(express.cookieParser());  
  app.use(express.bodyParser());    //for handling post data
  app.use(express.static(path.join(__dirname, 'public'))); //for handling static contents
  app.use(express.session({secret: 'monkey'})); //for using sessions
  app.use(flash()); //aaaaaaaaaahhhhhhhhhhhh!

  app.set('view engine', 'ejs');
});
//we're going to have /routes/index.js handle all of our routing
var route = require('./routes/index.js')(app);

app.listen(6789);