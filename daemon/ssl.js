var log = require('../utils/logger').createLogger('[daemon:ssl]');
var util = require("util");
var zmq = require("zmq");
var wire = require("./wire");
var wirerouter = require("./wire/router.js");
var wireutil = require("./wire/util.js");
var dbapi = require('../libs/db');
var SSLScanner = require('../libs/port/ssl');

module.exports.command = 'ssl';
module.exports.describe = 'ssl';

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('connect-sub', {
      describe: 'ZeroMQ SUB endpoint to connect to.'
    , array: true
    , demand: true
    })
    .option('connect-pull', {
        describe: 'The address to bind the ZeroMQ PULL endpoint to.'
        , type: 'string'
        , demand: true
    });
};

module.exports.handler = function(argvs){

    var push = zmq.socket("push");
    push.connect(argvs.connectPull);

    var sub = zmq.socket("sub");
    sub.identity = "ssl";
    sub.subscribe("");
    argvs.connectSub.forEach(function(endpoint){
        sub.connect(endpoint);
    })
        
    var ssl = new SSLScanner();
    ssl.start();

    ssl.on('ssl', function(options){
        //cert入库
        //update banner库信息

        //push SSLHost消息

    })

    ssl.on('nonssl', function(options){

        //push NonSSLHost消息
    })
    
    sub.on("message", 
    wirerouter().on(wire.IPv4Infomations, function(channel, message, data){
        var hosts = Array.prototype.slice.call(message.infos);
        ssl.scanHosts(hosts.map(function(i){
            return {
                taskId : channel.toString('utf-8'),
                host : i.ip,
                port : i.port
            }
        }));

    }).handler());
     

    function closeSocket(){
        log.info("Closing sockets...");
        [sub, push].forEach(function(socket){
            try{
                socket.close();
            }
            catch(err){

            }
        })
    }

    process.on("SIGINT", function(){
        Promise.resolve()
        .then(function(){
            closeSocket();
            process.exit(0);
        })
        
    })

    process.on("SIGTERM", function(){
        Promise.resolve()
        .then(function(){
            closeSocket();
            process.exit(0);
        })
    })
}

