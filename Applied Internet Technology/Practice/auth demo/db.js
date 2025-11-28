const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new mongoose.Schema({ });

UserSchema.plugin(passportLocalMongoose);

mongoose.model('User', UserSchema);
mongoose.connect('mongodb://localhost/class16db');