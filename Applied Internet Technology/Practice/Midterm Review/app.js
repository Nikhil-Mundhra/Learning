const express = require('express');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'hbs');


/*
words = [];
words = {};
*/

app.get('/', function(req, res) {
    const noun = req.query.noun || 'noun';
    const verb = req.query.verb || 'verb';
    res.render('index', {noun: noun, verb: verb});

});

/*
app.post('/', (req, res) => {
  res.redirect('/');
});
*/

app.listen(3000);
