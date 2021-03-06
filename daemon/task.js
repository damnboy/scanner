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
var _ = require('lodash');

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
    sub.bindSync(argvs.bindSub);
    log.info('SUB socket bound on', argvs.bindSub);

    pull.on("message", wirerouter()
    .on(wire.CreateScanTask, function(channel, message, data){
        var id = uuid();
        pub.send([id, wireutil.envelope(wire.ScanTaskInfo, {id : id})]);
    })
    .on(wire.DomainTaskReady, function(channel, message, data){
         //入库
         dbapi.saveDomainTask(message)
         .then(function(){
             log.info("Domain scan task(" + message.taskId + ") created...");
             //返回客户端创建后的任务id
             //各个daemon分别根据ClientReady中的id信息，到对应的index中获取任务细项进行扫描
             pub.send([channel, wireutil.envelope(wire.DomainTaskReady, message)]);
             
         })
         .catch(function(err){
             log.error(err);
         });
    })
    .on(wire.MixTaskReady, function(channel, message, data){
        dbapi.saveMixTask(message)
        .then(function(){
            log.info("Mix scan task(" + message.id + ") created...");
            //返回客户端创建后的任务id
            //各个daemon分别根据ClientReady中的id信息，到对应的index中获取任务细项进行扫描
            pub.send([channel, wireutil.envelope(wire.MixTaskReady, message)]);
            
        })
        .catch(function(err){
            log.error(err);
        });
    })
    .on(wire.ScanResultDNS, function(channel, message, data){
        
        //发送DNS扫描完成消息到whois与service进程
        //两进程各自从dnsrecord索引读取ip地址，进行各自的查询。
        
        setTimeout(function(){
            pub.send([channel, wireutil.envelope(wire.ScanResultDNS, {})]);
        }, 5000);
        
    })
    .on(wire.IPv4Infomation, function(channel, message, data){
        pub.send([channel, wireutil.envelope(wire.IPv4Infomation,message)]);
    })
    .on(wire.ServiceInformation, function(channel, message, data){
        pub.send([channel, wireutil.envelope(wire.ServiceInformation, message)]);
    })
    .on(wire.ScanResultWhois, function(channel, message, data){
        pub.send([channel, wireutil.envelope(wire.ScanResultWhois, message)]);
    })
    .on(wire.ScanResultService, function(channel, message, data){
        pub.send([channel, wireutil.envelope(wire.ScanResultService, message)]);
    })
    .on(wire.ScanResultServiceBanner, function(channel, message, data){
        message.taskId = channel.toString('utf-8');

        dbapi.saveBanner(message)
        .then(function(){
            pub.send([channel, wireutil.envelope(wire.ScanResultServiceBanner, message)]);
        })
        .catch(function(err){
            log.error(err);
        });
    }).handler());
    /*
    .on(wire.SSLHost, function(channel, message, data){
        pub.send([channel, wireutil.envelope(wire.SSLHost, message)]);
    })
    .on(wire.NonSSLHost, function(channel, message, data){
        pub.send([channel, wireutil.envelope(wire.NonSSLHost, message)]);
    })
    .on(wire.ScanResultDNSRecordA, function(channel, message, data){
        pub.send([channel, wireutil.envelope(wire.ScanResultDNSRecordA, message)]);
    })
    .on(wire.ScanResultDNSRecordCName, function(channel, message, data){
        pub.send([channel, wireutil.envelope(wire.ScanResultDNSRecordCName, message)]);
    })
    */

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
        process.exit(0);
    })

    process.on("SIGTERM", function(){
        closeSocket();
        process.exit(0);
    })
}