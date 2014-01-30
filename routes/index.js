module.exports = function Route(app){

    var bcrypt = require('bcrypt-nodejs');
    var account = require('./account');

    var mongoose = require('mongoose');
    var Schema = mongoose.Schema;

    var match = require('./match')(app);

    var userSchema = new Schema({
        name: { type: String, unique: true },
        email: { type: String, unique: true },
        hash: String,
        created_at: { type: Date, default: Date.now },
    });

    var User = mongoose.model('User', userSchema);
    //This will take the 'User' argument and create a MongoDB collection called 'users' from it

    app.post('/process_registrationMG', function(req, res){
        req.assert('email', 'A valid email is required').isEmail();
        var errors = req.validationErrors();

        if(errors){
            req.flash('info', errors);
            res.redirect('/register');
        }else{

            account.checkIfUserExistsMG(User, req.body['email'], function(err, result){
                if(result){
                    req.flash('info', 'User already exists.');
                    res.redirect('/register');
                }else{
                    var person = new User({
                        name: req.body['name'],
                        email: req.body['email'],
                    });
                    account.createHash(req.body['password'], function(err, hash_res){
                        person.hash = hash_res;
      
                        account.saveUserMG(person, function(){
                            console.log("New registration saved!");
                        });
                    }); 
                    req.session.email = req.body['email'];
                    req.session.user_name = req.body['name'];
                    res.redirect('/lobby');            
                }
            });
        }
    });

    app.post('/process_loginMG', function(req, res){
        account.checkIfUserExistsMG(User, req.body['email'], function(err, result){
            if(result){ //if yes, process the hash comparison, if match, redirect to /
               bcrypt.compare(req.body['password'], result['hash'], function(err, bcrypt_res){
                    if(err){
                        return console.error('error comparing password.', err);
                    }else{
                        if(bcrypt_res){
                            req.session.user_name = result['name'];
                            req.session.email = result['email'];
                            res.redirect('/lobby');
                        }else{                            
                            req.flash('info', 'Invalid password.');
                            res.redirect('/login');
                        }
                    }
                });
                res.redirect('/login');
            }else{ //if not, bounce the user back to /login with an error message
                req.flash('info', 'That user does not exist.');
                res.redirect('/login/');            
            }
        });
    });

    app.get('/', function(req, res){
        res.render('index', {title:'Node Tanks'
                            , message: req.flash('info')
                            , session: req.session
                            });
    });

    app.get('/guide', function(req, res){
        res.render('guide', {title:'Node Tanks Game Guide'
                            , message: req.flash('info')
                            , session: req.session
                            });
    });

    app.get('/play', function(req, res){
        res.render('play', {title:'Play Node Tanks'
                                , message: req.flash('info')
                                , session: req.session
                                });
    });

    app.get('/login', function(req, res){
        if(typeof(req.session['user_name']) != "undefined"){
            res.redirect('/account');
        }else{
            res.render('login', {title:'Node Tanks Login'
                                , message: req.flash('info')
                                , session: req.session
                                });
        }
    });

    app.get('/account', function(req, res){
        if(typeof(req.session['user_name']) == "undefined"){
            res.redirect('/login');
        }else{
            res.render('account', {title: 'Your Account Page'
                                , message: req.flash('info')
                                , session: req.session
                                });
        }
    });

    app.get('/register', function(req, res){
        res.render('register', {title:'Node Tanks Registration Page'
                                 , message: req.flash('info')
                                 , session: req.session
                                });
    });

    app.get('/lobby', function(req, res){
        res.render('lobby', {title:'Node Tanks Lobby Page'
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

    app.io.route("new_user", function(req){
        console.log("New user emit fired: ", req.data);
    });
}