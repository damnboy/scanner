var log = require('../utils/logger').createLogger('[daemon:service]')
var util = require("util");
var zmq = require("zmq");
var wire = require("./wire");
var wirerouter = require("./wire/router.js")
var wireutil = require("./wire/util.js")
var Queue = require("../utils/queue.js")
var NmapSchedule = require('../utils/external-nmap.js');
var dbapi = require('../libs/db');

module.exports.command = 'service'
module.exports.describe = 'service'
/*
    nmap static build
    https://diagprov.ch/posts/2016/06/static-nmap-builds-for-infosec-via-docker.html
    https://github.com/ZephrFish/static-tools
    https://blog.zsec.uk/staticnmap/

*/
module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('connect-sub', {
      describe: 'ZeroMQ SUB endpoint to connect to.'
    , array: true
    , demand: true
    })
    .option('connect-pull', {
        describe: 'The address to bind the ZeroMQ PULL endpoint to.'
        , type: 'string'
        , demand: true
    })
}

module.exports.handler = function(argvs){

    //var queue = new Queue(1); 
   
    var push = zmq.socket("push");
    push.connect(argvs.connectPull);

    var sub = zmq.socket("sub");
    sub.identity = "services";
    sub.subscribe("");
    argvs.connectSub.forEach(function(endpoint){
        sub.connect(endpoint);
    })
    
    NmapSchedule.on('tcp', function(taskId, ip, port){
        
        push.send([taskId, wireutil.envelope(wire.ServiceInformation, {
            "ip" : ip,
            "type" : "tcp",
            "ports" : [port],
            "scan" : false
        })]);
        
    });

    NmapSchedule.on('udp', function(taskId, ip, port){

        push.send([taskId, wireutil.envelope(wire.ServiceInformation, {
            "ip" : ip,
            "type" : "udp",
            "ports" : [port],
            "scan" : false
        })]);

    });

    NmapSchedule.on('host', function(taskId, ip, tcp, udp){
        //扫描结果入库存储，高仿节点返回大量开放端口，因此端口数量大于100的主机，跳过不执行扫描
        if(tcp.length < 100){

            push.send([taskId, wireutil.envelope(wire.ServiceInformation, {
                "ip" : ip,
                "type" : "tcp",
                "ports" : tcp,
                "scan" : true
            })]);
        }
        
        if(udp.length < 100){

            push.send([taskId, wireutil.envelope(wire.ServiceInformation, {
                "ip" : ip,
                "type" : "udp",
                "ports" : udp,
                "scan" : true
            })]);
        }  
    });

    NmapSchedule.start(dbapi);

    sub.on("message", wirerouter()
        .on(wire.IPv4Infomation, function(channel, message, data){
            //扫描任务入库，由nmap调度器负责读取尚未扫描的任务，并执行扫描
            var nmapTask = {
                "task_id" : channel.toString("utf-8"),
                "ip" : message.ip
            };

            dbapi.scheduleNmapTask(nmapTask);

        }).handler())



    function closeSocket(){
        log.info("Closing sockets...");
        [sub, push].forEach(function(socket){
            try{
                socket.close();
            }
            catch(err){

            }
            
        })
    }

    process.on("SIGINT", function(){
        NmapSchedule.wait()
        .then(function(){
            closeSocket();
            process.exit(0)
        })
        
    })

    process.on("SIGTERM", function(){
        NmapSchedule.wait()
        .then(function(){
            closeSocket();
            process.exit(0)
        })
    })
}

///////////////////////
//DEBUG
//process exit events
///////////////////////
/*
process.on("exit", function(code){
    log.info("Process exit with code: " + code);
})


process.on('SIGTERM', function(){
    log.info("Process exit with signal: SIGTERM");
    process.exit(0);
})

process.on('SIGINT', function(){
    log.info("Process exit with signal: SIGINT");
    process.exit(0);
})
*/