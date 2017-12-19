var log = require('../utils/logger').createLogger('[daemon:domain]')
/*
    data = {
        "domain" : "github.com",
        "dict" : "test",
        "nameservers" ： "8.8.8.8, 4.4.4.4"
    }

*/
process.on("message", function(data){
    
})


///////////////////////
//process exit events
///////////////////////
process.on("exit", function(code){
    log.info("Process exit with code: " + code);
})

process.on('SIGTERM', function(signal){
    log.info("Process exit with signal: SIGTERM");
    process.exit(0);
})

process.on('SIGINT', function(signal){
    log.info("Process exit with signal: SIGINT");
    process.exit(0);
})