var log = require('../utils/logger').createLogger('[daemon:whois]')
var zmq = require("zmq");

var sub = zmq.socket("sub");
sub.subscribe("");
sub.connect(process.argv[3])
sub.on("message", function(data){
    let message = JSON.parse(data);
    //log.info(message)
})


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