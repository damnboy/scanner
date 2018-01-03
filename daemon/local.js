var Promise = require("bluebird");
var fork = require("../utils/procutil.js").fork;
var log = require('../utils/logger').createLogger('[daemon:local]');
var path = require("../utils/path.js");

module.exports.command = 'local'

module.exports.describe = 'local'

module.exports.builder = function(yargs) {
  return yargs
    .strict()
}

module.exports.handler = function(argvs){
    var options = {
        "taskBindPub" : 'tcp://127.0.0.1:7110',
        "taskBindPull" : 'tcp://127.0.0.1:7111',
        "taskBindSub" : 'tcp://127.0.0.1:7112'
    }
    var procs = [
        fork(path.daemon("./index.js"), [
            "task",
            //"--bind-pub" , options.taskBindPub,
            //"--bind-pull" , options.taskBindPull,
            "--bind-sub" , options.taskBindSub
        ]),
        fork(path.daemon("./index.js"), [
            "domain" ,
            "--connect-sub", options.taskBindPub,
            "--connect-pull", options.taskBindPull
        ]),
        fork(path.daemon("./index.js"), [
            "service" ,
            "--connect-sub", options.taskBindPub,
            "--connect-pull", options.taskBindPull
        ]),
        fork(path.daemon("./index.js"), [
            "whois" ,
            "--connect-sub", options.taskBindPub,
            "--connect-pull", options.taskBindPull
        ]),
        fork(path.daemon("./index.js"), [
            "banner" ,
            "--connect-sub", options.taskBindPub,
            "--connect-pull", options.taskBindPull
        ])
    ];
    
    return Promise.all(procs)
    .then(function(r){
        process.exit(0);
    })
}
