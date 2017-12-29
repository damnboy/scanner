var zmq = require("zmq");
var push = zmq.socket("push");
var sub = zmq.socket("sub");
var EventEmitter = require("events").EventEmitter;
var wire = require("./wire");
var wirerouter = require("./wire/router.js");
var wireutil = require("./wire/util.js");

sub.on("message",
wirerouter()
.on(wire.ScanTaskInfo, function(channel, message, data){
    sub.close();
    sub = zmq.socket("sub");
    sub.subscribe(message.id);
    sub.connect("tcp://127.0.0.1:7110");

    setTimeout(function(){
        push.send([message.id, wireutil.envelope(wire.ClientReady, {
            "taskId" : message.id
        })]);
    }, 2000);

})
.handler());

sub.subscribe("");
sub.connect("tcp://127.0.0.1:7110");
push.connect("tcp://127.0.0.1:7111");

push.send(["channel", wireutil.envelope(wire.CreateDomainScanTaskInfo, {
    "email" : "root@localhost.com",
    "description" : "...",
    "targetDomain" : "189.cn",
    "dict" : "test"
})]);