var bcrypt = require('bcrypt-nodejs');

var mongoose = require('mongoose');
var uristring = process.env.MONGOLAB_URI ||
        'mongodb://localhost/test'

exports.checkIfUserExistsMG = function(model, email, callback){
    var db = mongoose.connection;

    mongoose.connect(uristring);
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function(){
        model.find({ email: email}, function(err, person){
            if(err) return console.log("There was a query error: ", err);
            mongoose.disconnect(console.log("Connection closed."));
            callback(null, person[0]);
        });
    }); 
};

exports.saveUserMG = function(model, callback){
    model.save(function(err){
        if(err){
            return console.log("There was an error attempting to save the user. Err:", err);
        }
        callback();
    });   
};

exports.createHash = function(password, callback){
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

exports.compareHash = function(password, hash){
    bcrypt.compare(password, hash, function(err, res){
        if(err){
            return console.error('error comparing password.', err);
        }else{
            return res;
        }
   });
};