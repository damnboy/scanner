var Promise = require("bluebird");
var fork = require("../utils/procutil.js").fork;
var log = require('../utils/logger').createLogger('[daemon:task]');
var path = require("../utils/path.js");
var uuid = require('uuid/v1');
var zmq = require("zmq");

module.exports = function(options){
    process.stdin.on("data", function(data){
        var domain = data.toString('utf-8').replace('\n','').replace('\r','')
        newTask(domain)
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
        var task_info = {
            "id" : uuid(),
            "name" : target,
            "target_domain" : target,
            "description" : "",
            "create_date" : Date.now(),
            "dict" : "top3000"
        }

        log.info('Scan task(%s) on %s started...', task_info.id, task_info.target_domain);

        //task 参数入库，完毕后分发task信息到域名，ip收集进程
        pub.send(JSON.stringify(task_info))
    }
    
    return Promise.all(procs)
    .then(function(r){
        process.exit(0);
    })
}