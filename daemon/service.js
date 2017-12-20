var log = require('../utils/logger').createLogger('[daemon:service]')
var util = require("util");
var zmq = require("zmq");


module.exports.command = 'service'

module.exports.describe = 'service'

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('connect-router', {
      describe: 'ZeroMQ ROUTER endpoint to connect to.'
    , array: true
    , demand: true
    })
}

module.exports.handler = function(argvs){

    var dealer = zmq.socket("dealer");
    dealer.identity = "service";
    argvs.connectRouter.forEach(function(endpoint){
        dealer.connect(endpoint);
    })


    function closeSocket(){
        log.info("Closing sockets...");
        [dealer].forEach(function(socket){
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