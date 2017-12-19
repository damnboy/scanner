var log = require('../utils/logger').createLogger('[daemon:whois]')

process.on("message", function(data){
    
})


///////////////////////
//DEBUG
//process exit events
///////////////////////
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