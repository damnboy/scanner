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

    setTimeout(function(){
        push.send([message.id, wireutil.envelope(wire.ClientReady, {
            "taskId" : message.id
        })]);
    }, 2000);
}).handler());

sub.subscribe("");
sub.connect(subUri);
push.connect(pushUri);

push.send(["channel", wireutil.envelope(wire.CreateDomainScanTaskInfo, {
    "email" : "root@localhost.com",
    "description" : "...",
    "targetDomain" : "189.cn",
    "dict" : "top3000"/*,
    "customNameservers" : ['223.5.5.5']*/
})]);


