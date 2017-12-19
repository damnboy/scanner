var Promise = require("bluebird");
var fork = require("../utils/procutil.js").fork;
var log = require('../utils/logger').createLogger('[daemon:task]');
var path = require("../utils/path.js");
var uuid = require('uuid/v1');
var zmq = require("zmq");

module.exports = function(options){
    process.stdin.on("data", function(data){
        newTask("189.cn")
    })
    var procs = [
        fork(path.daemon("./domain.js"), [
            "--pub" , "tcp://127.0.0.1:9001", //bind
            "--sub" , "tcp://127.0.0.1:9000"  //connect to
        ]),
        fork(path.daemon("./whois.js"), [
            "--sub" , "tcp://127.0.0.1:9001"  //connect to
        ]),
        fork(path.daemon("./services.js"), [
            "--sub" , "tcp://127.0.0.1:9001"  //connect to
        ])
    ];

    pub = zmq.socket("pub");

    pub.bind("tcp://127.0.0.1:9000", function(err){
        log.info("Listening for zmq sub");
    })

    function newTask(target){
        var task_id = uuid();
        log.info('Scan task(%s) on %s started...', task_id, target);
        pub.send(JSON.stringify({
            "task_id" : task_id,
            "target" : target,
            "dict" : "top3000"
        }))
    }
    
    return Promise.all(procs)
    .then(function(r){
        process.exit(0);
    })
}