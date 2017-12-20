var zmq = require("zmq");
var push = zmq.socket("push");
var sub = zmq.socket("sub");
var EventEmitter = require("events").EventEmitter;



var cmdRouter = new EventEmitter();
cmdRouter.on("NewChannel", function(taskInfo){
    console.log("new channel: " + taskInfo.id);
    sub.close();
    sub = zmq.socket("sub");
    sub.subscribe(taskInfo.id);
    sub.connect("tcp://127.0.0.1:7110");
    sub.on("message", function(channel, data){
        console.log("got message")
        let message = JSON.parse(data);
        cmdRouter.emit(message.cmd, message.data);
    })
    taskInfo.target_domain = "189.cn";
    taskInfo.dict = "test"

    push.send(JSON.stringify({
        "cmd" : "ScanTarget",
        "data" : taskInfo
    }))
})

cmdRouter.on("Show", function(data){
    console.log(data);
})

sub.on("message", function(channel, data){
    let message = JSON.parse(data);
    cmdRouter.emit(message.cmd, message.data);
})

sub.subscribe("");
sub.connect("tcp://127.0.0.1:7110");
push.connect("tcp://127.0.0.1:7111");
push.send(JSON.stringify({
    "cmd" : "CreateTask"
}))