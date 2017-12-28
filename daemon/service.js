var log = require('../utils/logger').createLogger('[daemon:service]')
var util = require("util");
var zmq = require("zmq");
var wire = require("./wire");
var wirerouter = require("./wire/router.js")
var wireutil = require("./wire/util.js")
var Queue = require("../utils/queue.js")
var NmapSchedule = require('../utils/external-nmap.js');
var dbClient = require('../libs/db');

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
    sub.subscribe("")
    argvs.connectSub.forEach(function(endpoint){
        sub.connect(endpoint);
    })
    
    dbClient({
        'host' : '127.0.0.1',
        'port' : 9200
    })
    .then(function(dbapi){
        NmapSchedule.start(dbapi);

        sub.on("message", wirerouter()
            .on(wire.IPv4Infomation, function(channel, message, data){
                var nmapTask = {
                    "task_id" : channel.toString("utf-8"),
                    "ip" : message.ip
                };

                dbapi.scheduleNmapTask(nmapTask);
                //host端口扫描任务全部入库，处理，用flag标示是否扫描成功
                //需要队列控制并行的nmap数量，避免扫描流量过大导致崩溃
                /*
                queue.enqueue(function(){
                    return externalNmap.portScanner(message.ip)
                    .catch(function(err){
                        log.warn('detecting host open service error: ' + err)
                    })
                })
                */
            })
            .handler()
        )
    })
    .catch(function(err){
        log.error(err)
    })


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