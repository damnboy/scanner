var zmq = require("zmq");
var push = zmq.socket("push");
var sub = zmq.socket("sub");
var EventEmitter = require("events").EventEmitter;
var wire = require("./daemon/wire");
var wirerouter = require("./daemon/wire/router.js");
var wireutil = require("./daemon/wire/util.js");
var log = require('./utils/logger').createLogger('[client:client]');
var subUri = "tcp://127.0.0.1:7110";
var pushUri = "tcp://127.0.0.1:7111";
//var subUri = "tcp://198.177.122.30:7110";
//var pushUri = "tcp://198.177.122.30:7111";
//var subUri = "tcp://218.85.154.137:7110";
//var pushUri = "tcp://218.85.154.137:7111";
sub.on("message",
wirerouter()
.on(wire.ScanTaskInfo, function(channel, message, data){
    log.info('task (%s) created', message.id);
    sub.close();
    sub = zmq.socket("sub");
    sub.subscribe(message.id);
    sub.on("message", wirerouter()
    .on(wire.ScanResultDNSRecordA, function(channel, message, data){
        //dns a记录
        log.info('[DNS] %s @ %s', message.domain, message.data);
    })
    .on(wire.ScanResultDNSRecordCName, function(channel, message, data){
        //dns cname记录
        //log.info('[DNS] %s @ %s', message.domain, message.data);  
    })
    .on(wire.ScanResultWhois, function(channel, message, data){
        //ip whois信息
        //log.info('[WHOIS] %s located at %s with netname: %s', message.ip, message.details[0].netblock, message.details[0].netname);
    })
    .on(wire.ScanResultService, function(channel, message, data){
        //主机开放端口
        log.info(message);
    })
    .on(wire.ScanResultServiceBanner, function(channel, message, data){
        //端口指纹
        log.info('[SERVICE] %s running on %s:%s', message.service.toUpperCase(), message.ip, message.port)
        log.info('[SERVICE] Version: %s', message.version);
    }).handler())
    sub.connect(subUri);

    /*
    setTimeout(function(){
        push.send([message.id, wireutil.envelope(wire.DomainTaskReady, {
            "id" : message.id,    
            "targetDomain" : "qq.cn",
            "dict" : "test"
        })]);
    }, 2000);
    */
    setTimeout(function(){
        push.send([message.id, wireutil.envelope(wire.MixTaskReady, {
            id : message.id,    
            domains : ['qh.118100.cn','qh.bnet.cn'],
            hosts : ['118.213.207.209',
            '125.72.125.240',
            '125.72.248.34',
            '125.72.248.5',
            '125.72.248.97',
            '125.72.36.198',
            '125.72.36.199',
            '135.192.1.154',
            '135.192.1.159',
            '135.192.1.162',
            '135.192.1.169',
            '135.192.5.228',
            '172.24.195.5',
            '172.24.213.199',
            '202.100.139.41',
            '202.100.139.44',
            '202.100.139.50',
            '202.100.139.8',
            '223.220.160.147',
            '223.220.160.74',
            '223.220.160.74',
            '223.220.160.94',
            '223.220.161.89',
            '223.220.243.22',
            '223.221.8.9']
        })]);
    }, 2000);

}).handler());

sub.subscribe("");
sub.connect(subUri);
push.connect(pushUri);

push.send(["channel", wireutil.envelope(wire.CreateScanTask, {
    "email" : "root@localhost.com",
    "description" : "..."
})]);


