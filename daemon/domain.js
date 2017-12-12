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

process.on("exit", function(code, signal){
    log.info("Process exit with: " + (code !== undefined ? code : signal));
})

