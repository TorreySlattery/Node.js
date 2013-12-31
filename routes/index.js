module.exports = function Route(app){

    var pg = require('pg');
    var bcrypt = require('bcrypt-nodejs');

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;
    var db = mongoose.connection;

    mongoose.connect('mongodb://localhost/test');
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function callback(){
        // console.log("Yay!");
    }); 

    var userSchema = new Schema({
        name: String,
        email: { type: String, unique: true },
        hash: String,
        created_at: { type: Date, default: Date.now },
    });

    var User = mongoose.model('User', userSchema);

    var john = new User({
                        name: 'John',
                        email: 'john@email.com',
                        hash: 'myHash'
    });

    // john.save(function(err){
    //     if(err){
    //         return console.log("There was an error: ", err);
    //     }
    //     console.log("Saved!");
    // });

    User.find({ name: 'John'}, function(err, person){
        if(err) return console.log("There was a query error: ", err);
        console.log('%s is %s with %s', 
            person[0]['name'], person[0]['email'], person[0]['hash']);
    });

    app.get('/', function(req, res){
        res.render('index', {title:'Hold Fast!'
                            , message: req.flash('info')
                            , session: req.session
                            });
    });

    app.get('/guide', function(req, res){
        res.render('guide', {title:'Hold Fast! Game Guide'
                            , message: req.flash('info')
                            , session: req.session
                            });
    });

    app.get('/play', function(req, res){
        res.render('play', {title:'Play Hold Fast!'
                                , message: req.flash('info')
                                , session: req.session
                                });
    });

    app.get('/login', function(req, res){
        if(typeof(req.session['user_name']) != "undefined"){
            res.redirect('/account');
        }else{
            res.render('login', {title:'Hold Fast! Login'
                                , message: req.flash('info')
                                , session: req.session
                                });
        }
    });

    app.get('/account', function(req, res){
        res.render('account', {title: 'Your Account Page'
                            , message: req.flash('info')
                            , session: req.session
                            });
    });

    app.get('/register', function(req, res){
        res.render('register', {title:'Hold Fast! Registration Page'
                                 , message: req.flash('info')
                                 , session: req.session
                                });
    });

    app.get('/help', function(req, res){
        res.render('help', {title:'Hold Fast! Help Page'
                                , message: req.flash('info')
                                , session: req.session
                                });
    });

    app.get('/announcements', function(req, res){
        res.render('announcements', {title:'Official Announcments From the Hold Fast Team'});
    });

    app.get('/logout', function(req, res){
        req.session.destroy();
        res.redirect('/');
    });


    app.post('/process_registration', function(req, res){
        checkIfUserExists(req.body['email'], function(err, result){
            if(result){ //If user exists, registration fails
                req.flash('info', 'User already exists.');
                res.redirect('/register');

            }else{ //If not, create new user

                var conString = "postgres://postgres:postgres@localhost/mydb";

                var client = new pg.Client(conString);

                client.connect(function(err) {
                    if(err) {
                        return console.error('could not connect to postgres', err);
                    }
                    var name = req.body['name'];
                    var email = req.body['email'];

                    createHash(req.body['password'], function(err, hash_res){
                        client.query("insert into users(name, email, hash, created_at) values($1, $2, $3, $4)", 
                                [name, email, hash_res, "now()"], function (err, query_result) {
                            if(err){
                                return console.error('error running query', err);
                            }                            
                            client.end();
                        });                        
                    });                    
                });
                req.session.user_name = req.body['name'];
                res.redirect('/');
            }
        });
    });

    app.post('/process_login', function(req, res){
        checkIfUserExists(req.body['email'], function(err, result){
            if(result){ //if user exists, check to see if the credentials work
                bcrypt.compare(req.body['password'], result['hash'], function(err, bcrypt_res){
                    if(err){
                        return console.error('error comparing password.', err);
                    }else{
                        if(bcrypt_res){
                            req.session.user_name = result['name'];
                            res.redirect('/');
                        }else{                            
                            req.flash('info', 'Invalid password.');
                            res.redirect('/login');
                        }
                    }
                });
                res.redirect('/login');
            }else{ //if not, redirect back to the login page with any errors
                req.flash('info', 'User does not exist.'); //I wouldn't want to give this specific of an error message normally, but eh.
                res.redirect('/login');
            }        
        });
    });

    function createHash(password, callback){
        bcrypt.genSalt(10, function(err, salt){
            bcrypt.hash(password, salt, null, function(err, hash){
                if(err){
                    return console.error('error hashing password.', err);
                }else{
                    return callback(err, hash);
                }
            });
        });
    };

    function compareHash(password, hash){
        bcrypt.compare(password, hash, function(err, res){
            if(err){
                return console.error('error comparing password.', err);
            }else{
                return res;
            }
       });
    };

    function checkIfUserExists(email, callback){
        var conString = "postgres://postgres:postgres@localhost/mydb";

        var client = new pg.Client(conString);

        client.connect(function(err) {
            if(err) {
                return console.error('could not connect to postgres', err);
            }

            client.query("select * from users where email=$1", [email], function (err, result){
                if(err){
                    return console.error('Error running query: ', err);
                }
                callback(null, result.rows[0]); //if there's a match, this will be true
                client.end();
            });
        });
    };
    app.io.route("new_user", function(req){
        console.log("New user emit fired: ", req.data);
    });

    app.io.route('disconnect', function(req){
        // console.log("Client disconnected.", req.sessionID);
        req.io.broadcast('disconnect', {id: req.sessionID});
    });
}