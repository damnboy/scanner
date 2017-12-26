var log = require('../utils/logger').createLogger('[daemon:whois]')
var util = require("util");
var zmq = require("zmq");
var wire = require("./wire");
var wirerouter = require("./wire/router.js")
var wireutil = require("./wire/util.js")
var IPWhois = require('../libs/whois');
module.exports.command = 'whois'

module.exports.describe = 'whois'

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
    })
}


module.exports.handler = function(argvs){
    
    var push = zmq.socket("push");
    push.connect(argvs.connectPull);

    var sub = zmq.socket("sub");
    sub.identity = "whois";
    sub.subscribe("")
    argvs.connectSub.forEach(function(endpoint){
        sub.connect(endpoint);
    })
    
    var whois = new IPWhois();
    sub.on("message", wirerouter()
        .on(wire.IPv4Infomation, function(channel, message, data){
            //whois扫描后入库
            whois.whois(message.ip)
            .then(function(detail){
                
                //消息返回task，并推送到client端
            })
            .catch(function(err){
                log.err(err)
            })
        })
        .handler()
    )

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
        closeSocket();
    })

    process.on("SIGTERM", function(){
        closeSocket();
    })
}


///////////////////////
//DEBUG
//process exit events
///////////////////////
/*
process.on("exit", function(code){
    log.info("Process exit with code: " + code);
})


process.on('SIGTERM', function(){
    log.info("Process exit with signal: SIGTERM");
    process.exit(0);
})

process.on('SIGINT', function(){
    log.info("Process exit with signal: SIGINT");
    process.exit(0);
})
*/