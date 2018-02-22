var log = require('../../../utils/logger').createLogger('[daemon:banner:nmap]');
var util = require("util");
var zmq = require("zmq");
var wire = require("../../wire");
var wirerouter = require("../../wire/router.js");
var wireutil = require("../../wire/util.js");
var Queue = require("../../../utils/queue.js");
var nmap = require('./nmap.js');
var dbapi = require('../../../libs/db');

module.exports.command = 'bannernmap';
module.exports.describe = 'bannernmap';

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
    });
};

module.exports.handler = function(argvs){

    var push = zmq.socket("push");
    push.connect(argvs.connectPull);

    var sub = zmq.socket("sub");
    sub.identity = "bannernmap";
    sub.subscribe("");
    argvs.connectSub.forEach(function(endpoint){
        sub.connect(endpoint);
    })
    

    function schedule(){
        dbapi.getScheduledNmapBannerTasks()
        .then(function(tasks){
            return Promise.all(tasks.map(function(task){
                return nmap.portBanner({
                    taskId : task.taskId,
                    ip : task.ip,
                    port : task.port,
                    type : task.type
                })
                .then(function(bannerInfo){
                    dbapi.doneScheduledNmapBannerTask(bannerInfo)
                    .then(function(){
                        setTimeout(function(){
                            schedule();
                        }, 5000); //等待els写入完成
                    })
                    .catch(function(err){
                        log.error('schedule ' , err);
                        setTimeout(function(){
                            schedule();
                        }, 5000); 
                    });
                });
            }))
        })
        .catch(function(err){
            log.error('schedule ' + err);
            setTimeout(function(){
                schedule();
            }, 5000);
        });
    }

    schedule()
    sub.on("message", 
    wirerouter().on(wire.ServiceInformation, function(channel, message, data){
         //扫描任务入库，由nmap调度器负责读取尚未扫描的任务，并执行扫描
         /*
         if(!message.scan){
             return;
         }

         if(message.type === 'tcp'){
             message.ports.forEach(function(port){
                 NmapSchedule.portBanner(message.ip, port)
                 .then(function(banner){
                    push.send([channel, wireutil.envelope(wire.ScanResultServiceBanner, banner)]);
                 })
             });
         }
         */
     }).handler());


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
        nmap.wait()
        .then(function(){
            closeSocket();
            process.exit(0);
        });
    });

    process.on("SIGTERM", function(){
        nmap.wait()
        .then(function(){
            closeSocket();
            process.exit(0);
        });
    });
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