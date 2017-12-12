var log = require('../utils/logger').createLogger('[daemon:whois]')

process.on("message", function(data){
    
})


process.on("exit", function(code, signal){
    log.info("Process exit with: " + (code !== undefined ? code : signal));
})

