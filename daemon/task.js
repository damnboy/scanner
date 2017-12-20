var Promise = require("bluebird");
var fork = require("../utils/procutil.js").fork;
var log = require('../utils/logger').createLogger('[daemon:task]');
var path = require("../utils/path.js");
var uuid = require('uuid/v1');
var zmq = require("zmq");
var EventEmitter = require("events").EventEmitter;

module.exports.command = "task";

module.exports.describe = "task";

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('bind-pub', {
      describe: 'The address to bind the ZeroMQ PUB endpoint to.'
        , type: 'string'
        , default: 'tcp://*:7110'
    })
    .option('bind-pull', {
        describe: 'The address to bind the ZeroMQ PULL endpoint to.'
        , type: 'string'
        , default: 'tcp://*:7111'
      })
    .option('bind-router', {
         describe: 'The address to bind the ZeroMQ ROUTER endpoint to.'
        , type: 'string'
        , default: 'tcp://*:7112'
    })
}

module.exports.handler = function(argvs){

    var pub = zmq.socket("pub");
    pub.bindSync(argvs.bindPub)
    log.info('PUB socket bound on', argvs.bindPub)

    var pull = zmq.socket("pull");
    pull.bindSync(argvs.bindPull)
    log.info('PULL socket bound on', argvs.bindPull)

    var router = zmq.socket("router");
    router.bindSync(argvs.bindRouter)
    log.info('ROUTER socket bound on', argvs.bindRouter)

    var cmdRouter = new EventEmitter();
    cmdRouter.on('CreateTask', function(){
        var id = uuid();
        pub.send([id, JSON.stringify({
            "cmd" : "NewChannel",
            "data" : {
                "id" : id,
                "dict" : "test"
            }
        })])

    })

    cmdRouter.on('ScanTarget', function(taskInfo){
        router.send(["domain", JSON.stringify(taskInfo)])
    })

    pull.on("message", function(data){
        let message = JSON.parse(data);
        log.info("got cmd: " + message.cmd)
        cmdRouter.emit(message.cmd, message.data);
    })

    var innerRouter = new EventEmitter();
    router.on("message", function(source, data){
        innerRouter.emit(source, data)
    })

    innerRouter.on("domain", function(data){
        let record = JSON.parse(data);
        var d = [
            record.task_id,
            JSON.stringify({
                "cmd" : "Show",
                "data" : record.record
            })
        ];
        log.info(d)
        pub.send(d);
    })

    innerRouter.on("service", function(data){

    })

    innerRouter.on("whois", function(data){

    })

    
    function closeSocket(){
        log.info("Closing sockets...");
        [pub, pull, router].forEach(function(socket){
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