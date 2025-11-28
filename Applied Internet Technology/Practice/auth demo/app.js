require('./db');
require('./auth');
require('./routes/route');

const passport = require('passport');

const session = require('express-session');
const sessionOptions = {
	secret: 'secret cookie thang (store this elsewhere!)',
	resave: true,
	saveUninitialized: true
};
app.use(session(sessionOptions));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
	res.locals.user = req.user;
	next();
});