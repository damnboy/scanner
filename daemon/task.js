var Promise = require("bluebird");
var fork = require("../utils/procutil.js").fork;
var log = require('../utils/logger').createLogger('[daemon:task]');
var path = require("../utils/path.js");

module.exports = function(options){
    var procs = [
        fork(path.daemon("./domain.js"), []),
        fork(path.daemon("./whois.js"), []),
        fork(path.daemon("./services.js"), [])
    ];

    return Promise.all(procs)
    .then(function(){
        process.exit(0)
    })
}