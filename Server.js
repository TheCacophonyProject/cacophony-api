//var Sequelize = require('sequelize');
var models = require('./models');
var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var passport = require('passport');
var config = require('./config');
var path = require('path');

var app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

app.use(morgan('dev'));

app.use(passport.initialize());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

require('./api/V1')(app);
require('./router')(app);

app.listen(config.server.port);
console.log('Open on http://localhost:'+config.server.port);

console.log("Connecting to database.....");
models.sequelize.sync()
.then(function() {
  console.log("Connected to database.");
});
