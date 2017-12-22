var log = require('../utils/logger').createLogger('[daemon:service]')
var util = require("util");
var zmq = require("zmq");
var wire = require("./wire");
var wirerouter = require("./wire/router.js")
var wireutil = require("./wire/util.js")

module.exports.command = 'service'

module.exports.describe = 'service'

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('connect-sub', {
      describe: 'ZeroMQ SUB endpoint to connect to.'
    , array: true
    , demand: true
    })
}


module.exports.handler = function(argvs){

    var sub = zmq.socket("sub");
    sub.identity = "services";
    sub.subscribe("")
    argvs.connectSub.forEach(function(endpoint){
        sub.connect(endpoint);
    })
    
    sub.on("message", wirerouter()
        .on(wire.Debugging, function(channel, message, data){
            //入库，提交到domian进行扫描
            log.info(message);
        })
        .handler()
    )


    function closeSocket(){
        log.info("Closing sockets...");
        [sub].forEach(function(socket){
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