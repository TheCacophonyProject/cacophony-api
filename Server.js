var express = require('express'),
  http = require('http'),
  path = require('path'),
  orm = require('./models/orm'),
  log = require('./logging'),
  config = require('./config');

var app = express();

require('./router/main')(app);
require('./router/apiv1')(app);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));

log.info('Syncing to database.');
orm.sync()
.then(function() {
  log.info('Sync to Database finished.');
  var server = app.listen(config.server.port, function() {
    log.info("Server has started on port", config.server.port);
  });
});
