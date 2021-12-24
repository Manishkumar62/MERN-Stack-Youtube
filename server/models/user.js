const mongoose = require('mongoose');
//used in encryption of password
const bcrypt = require('bcrypt');
//password size is 10
const saltRounds = 10;
const jwt = require('jsonwebtoken');

//schema that how the post request to be stored in database
const userSchema = mongoose.Schema({
    name:{
        type:String,
        maxlength:50
    },
    email:{
        type:String,
        trim:true,
        unique: 1
    },
    password:{
        type:String,
        minlength:5
    },
    lastname:{
        type:String,
        maxlength:50
    },
    role:{
        type:Number,
        default:0
    },
    token:{
        type:String
    },
    tokenExp:{
        type:Number
    }
})

//before saving the data given, running [function]
userSchema.pre('save',function(next){
    //whatever data given before saving, transfering to [user]
    var user = this;

    if(user.isModified('password')){

        //generating random salt(10 character string) with function
        bcrypt.genSalt(saltRounds,function(err,salt){
            //error in generating salt, returning nextFunction with that error
            if(err) return next(err);
    
            //successful in generating salt
            //By hashing a plain text password plus a salt, the hash algorithm’s output is no longer predictable. The same password will no longer yield the same hash. The salt gets automatically included with the hash, so you do not need to store it in a database.
            bcrypt.hash(user.password, salt, function(err, hash){
                //error in hash algorithm, returning nextFunction with that error
                if(err) return next(err);
                //successfully storing hashed password in password section
                user.password = hash
                next();
            })
        })
    }else{
        next();
    }
    
})

//making mathod --similarity [plainPassword=req.body.password],[cb=(err,isMatch)=>{}]
userSchema.methods.comparePassword =  function(plainPassword,cb){
    //comparing givenPassword to storedPassword
    bcrypt.compare(plainPassword,this.password,function(err,isMatch){
        //if not matched then sending error to cb
        if(err) return cb(err);
        //if password matched then sending true to cb
        cb(null, isMatch)
    })
}

//The below code in user model will generate token as when the username & password matched and saved in mongodb as token, [user.generateToken] method then send the token as response to browser using cookie-parser.
//making mathod --similarity [cb=(err, user)=>{}]
userSchema.methods.generateToken = function(cb){
    var user = this;
    //token is generated using user._id is default id stored in every registeration
    var token = jwt.sign(user._id.toHexString(),'secret')

    user.token = token;
    user.save(function(err,user){
        if(err) return cb(err)
        //successfull in saving token
        cb(null,user);
    })
}

userSchema.statics.findByToken = function(token, cb){
    var user = this;

    jwt.verify(token, 'secret', function(err, decode){
        user.findOne({"_id":decode, "token":token}, function(err, user){
            if(err) return cb(err);
            cb(null, user);
        })
    })
}

module.exports = mongoose.model('User',userSchema);