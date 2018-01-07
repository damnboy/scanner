var app = require('express')();
var http = require('http').Server(app);
var dns = require('../libs/dns');
var IPWhois = require('../libs/whois');
var dict = require('../utils/dict');
var log = require('../utils/logger.js');
var logger = log.createLogger('[api-server]');
var bodyParser = require('body-parser');


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use('/task', require('./api/task'));
app.use('/service', require('./api/service'));
app.use('/dnsrecord', require('./api/dnsrecord'));
app.use('/banner', require('./api/banner'));
app.use('/debug', require('./debug'));

app.use(function(err, req, res, next){
  console.log('---err---');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});