var Promise = require("bluebird");
var fork = require("../utils/procutil.js").fork;
var log = require('../utils/logger').createLogger('[daemon:task]');
var path = require("../utils/path.js");
var uuid = require('uuid/v1');
var zmq = require("zmq");
var EventEmitter = require("events").EventEmitter;
var wire = require("./wire");
var wirerouter = require("./wire/router.js");
var wireutil = require("./wire/util.js");
var dbapi = require('../libs/db');

module.exports.command = "task";

module.exports.describe = "task";

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('bind-pub', {
      describe: 'The address to bind the ZeroMQ PUB endpoint to.'
        , type: 'string'
        , default: 'tcp://0.0.0.0:7110'
    })
    .option('bind-pull', {
        describe: 'The address to bind the ZeroMQ PULL endpoint to.'
        , type: 'string'
        , default: 'tcp://0.0.0.0:7111'
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
    log.info('SUB socket bound on', argvs.bindSub);



    pull.on("message", wirerouter()
    .on(wire.CreateDomainScanTaskInfo, function(channel, message, data){

        var taskInfo =  {
            "id" : uuid(),
            "createDate" : Date.now(),
            "createBy" : message.email,
            "description" : "",
            "remark" : "",
            "domain" : message.targetDomain,
            "dict" : message.dict
        };

        //入库
        dbapi.saveDomainTask(taskInfo)
        .then(function(){
            log.info("Domain scan task("+taskInfo.id+") created...")
            //返回客户端创建后的任务id
            pub.send([taskInfo.id, wireutil.envelope(wire.ScanTaskInfo, {
                "id" : taskInfo.id,
                "createDate" : taskInfo.createDate
            })]);
        })
        .catch(function(err){
            log.error(err);
        })
    })
    .on(wire.ClientReady, function(channel, message, data){
        //各个daemon分别根据ClientReady中的id信息，到对应的index中获取任务细项进行扫描
        pub.send([channel, wireutil.envelope(wire.ClientReady, message)]);
    })
    .on(wire.IPv4Infomation, function(channel, message, data){
        pub.send([channel, wireutil.envelope(wire.IPv4Infomation,message)]);
    })
    .on(wire.ServiceInformation, function(channel, message, data){
        pub.send([channel, wireutil.envelope(wire.ServiceInformation, message)]);
    })
    .on(wire.ScanResultDNSRecordA, function(channel, message, data){
        //dns a记录
        log.info(message);
        pub.send([channel, wireutil.envelope(wire.ScanResultDNSRecordA, message)]);
    })
    .on(wire.ScanResultDNSRecordCName, function(channel, message, data){
        //dns cname记录
        log.info(message);
        pub.send([channel, wireutil.envelope(wire.ScanResultDNSRecordCName, message)]);
        
    })
    .on(wire.ScanResultWhois, function(channel, message, data){
        //ip whois信息
        log.info(message);
        pub.send([channel, wireutil.envelope(wire.ScanResultWhois, message)]);
    })
    .on(wire.ScanResultService, function(channel, message, data){
        //主机开放端口
        log.info(message);
        pub.send([channel, wireutil.envelope(wire.ScanResultService, message)]);
    })
    .on(wire.ScanResultServiceBanner, function(channel, message, data){
        //端口指纹
        log.info(message);
        pub.send([channel, wireutil.envelope(wire.ScanResultServiceBanner, message)]);

    }).handler());

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