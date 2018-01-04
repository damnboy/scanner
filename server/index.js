var app = require('express')();
var http = require('http').Server(app);
var dns = require('../libs/dns');
var IPWhois = require('../libs/whois');
var dict = require('../utils/dict');
var log = require('../utils/logger.js');
var logger = log.createLogger('[PROBE-SERVER]');

app.use('/task', require('./api'))

http.listen(3000, function(){
  console.log('listening on *:3000');
});