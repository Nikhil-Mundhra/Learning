const express = require('express'), 
    router = express.Router(),
    passport = require('passport'),
    mongoose = require('mongoose'),
    User = mongoose.model('User');

// route handlers go above
module.exports = router;

router.get('/', function(req, res) {
    res.render('index');
  });
  
router.get('/login', function(req, res) {
    res.render('login');
});
  
router.get('/register', function(req, res) {
    res.render('register');
});

router.post('/register', function(req, res) {
    User.register(new User({username:req.body.username}), 
        req.body.password, function(err, user){
      if (err) {
        res.render('register',{message:'Your registration information is not valid'});
      } else {
        passport.authenticate('local')(req, res, function() {
          res.redirect('/');
        });
      }
    });   
});

router.post('/login', function(req,res,next) {
    passport.authenticate('local', function(err,user) {
      if(user) {
        req.logIn(user, function(err) {
          res.redirect('/');
        });
      } else {
        res.render('login', {message:'Your login or password is incorrect.'});
      }
    })(req, res, next);
});