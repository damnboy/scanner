var Promise = require("bluebird");
var fork = require("../utils/procutil.js").fork;
var log = require('../utils/logger').createLogger('[daemon:task]');
var path = require("../utils/path.js");
var uuid = require('uuid/v1');
var zmq = require("zmq");
var EventEmitter = require("events").EventEmitter;
var wire = require("./wire");
var wirerouter = require("./wire/router.js")
var wireutil = require("./wire/util.js")


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
    .option('bind-sub', {
         describe: 'The address to bind the ZeroMQ SUB endpoint to.'
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

    var sub = zmq.socket("sub");
    sub.subscribe("");
    sub.bindSync(argvs.bindSub)
    log.info('SUB socket bound on', argvs.bindSub)

    pull.on("message", wirerouter()
        .on(wire.CreateScanTask, function(channel, message, data){

            var taskInfo =  {
                "id" : uuid(),
                "description" : "todo",
                "targetDomain" : "unknown",
                "dict" : "top3000",
                "date" : Date.now()
            };

            pub.send([taskInfo.id, wireutil.envelope(wire.ScanTaskInfo,taskInfo)]);
        })
        .on(wire.DomainScanTaskInfo, function(channel, message, data){
            //入库，提交到domian进行扫描
            pub.send([channel, wireutil.envelope(wire.DomainScanTaskInfo,message)]);
        })
        .on(wire.IPv4Infomation, function(channel, message, data){
            log.info('new ip address detected: ' + message.ip)

            pub.send([channel, wireutil.envelope(wire.IPv4Infomation,message)]);
        })
        .on(wire.ScanResultDNSRecordA, function(channel, message, data){
            //dns a记录
            
        })
        .on(wire.ScanResultDNSRecordCName, function(channel, message, data){
            //dns cname记录
            
        })
        .on(wire.ScanResultWhois, function(channel, message, data){
            //ip whois信息
            
        })
        .on(wire.ScanResultService, function(channel, message, data){
            //主机开放端口
            
        })
        .on(wire.ScanResultServiceBanner, function(channel, message, data){
            //端口指纹
            
        })
        .handler()
    )

    var innerRouter = new EventEmitter();
    sub.on("message", function(source, data){
        innerRouter.emit(source, source, data)
    })

    innerRouter.on("domain", wirerouter()
    .on(wire.Debugging, function(channel, message, data){

    })
    .handler())

    innerRouter.on("whois", wirerouter()
    .on(wire.Debugging, function(channel, message, data){

    })
    .handler())

    innerRouter.on("service", wirerouter()
    .on(wire.Debugging, function(channel, message, data){

    })
    .handler())

    function closeSocket(){
        log.info("Closing sockets...");
        [pub, pull, sub].forEach(function(socket){
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