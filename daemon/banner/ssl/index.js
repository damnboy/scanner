
var log = require('../../../utils/logger').createLogger('[daemon:banner:ssl]');
var util = require("util");
var zmq = require("zmq");
var wire = require("../../wire");
var wirerouter = require("../../wire/router.js");
var wireutil = require("../../wire/util.js");
var dbapi = require('../../../libs/db');
var SSLScanner = require('../../../libs/port/ssl');

module.exports.command = 'bannerssl';
module.exports.describe = 'bannerssl';

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('connect-sub', {
      describe: 'ZeroMQ SUB endpoint to connect to.', 
      array: true, 
      demand: true
    })
    .option('connect-pull', {
        describe: 'The address to bind the ZeroMQ PULL endpoint to.', 
        type: 'string', 
        demand: true
    });
};

module.exports.handler = function(argvs){

    var push = zmq.socket("push");
    push.connect(argvs.connectPull);

    var sub = zmq.socket("sub");
    sub.identity = "bannerssl";
    sub.subscribe("");
    argvs.connectSub.forEach(function(endpoint){
        sub.connect(endpoint);
    })
        

    var ssl = new SSLScanner();

    ssl.on('ssl', function(sslHostInfo){
        //cert入库
        dbapi.saveSSLCert(sslHostInfo)
        .then(function(){
            //update banner库信息
            return dbapi.doneScheduledSSLBannerTask({
                done : false,
                scannedBy : "ssl",
                sslSupport : true,
                taskId : sslHostInfo.taskId,
                ip : sslHostInfo.host,
                port : sslHostInfo.port
            });
        })
        .catch(function(err){
            log.error(err);
            log.info(sslHostInfo);
        });
    });

    ssl.on('nonssl', function(nonSSLHostInfo){
        dbapi.doneScheduledSSLBannerTask({
            "done" : false,
            "scannedBy" : "ssl",
            "sslSupport" : false,
            "taskId" : nonSSLHostInfo.taskId,
            "ip" : nonSSLHostInfo.host,
            "port" : nonSSLHostInfo.port
        })
        .catch(function(err){
            log.error(err);
        });
    });
    
    ssl.on('empty', function(){
        schedule(5000);
    });

    function schedule(timeout){
        //timer释放问题
        var timer = setTimeout(function(){
            dbapi.getScheduledSSLBannerTasks()
            .then(function(tasks){
                if(tasks.length === 0){
                    //log.info('ssl scan queue is empty');
                    schedule(5000);
                }
                else{
                    ssl.scanHosts(
                        tasks.map(function(t){
                            return {
                                "taskId" : t.taskId,
                                "host" : t.ip,
                                "port" : t.port
                            };
                        })
                    );
                }
            })
            .catch(function(err){
                log.error(err);
                schedule(5000);
            });
        }, timeout);
    }

    schedule(0);

    sub.on("message", 
    wirerouter().on(wire.IPv4Infomations, function(channel, message, data){


    }).handler());
     

    function closeSocket(){
        log.info("Closing sockets...");
        [sub, push].forEach(function(socket){
            try{
                socket.close();
            }
            catch(err){

            }
        });
    }

    process.on("SIGINT", function(){
        Promise.resolve()
        .then(function(){
            closeSocket();
            process.exit(0);
        })
        
    })

    process.on("SIGTERM", function(){
        Promise.resolve()
        .then(function(){
            closeSocket();
            process.exit(0);
        })
    })

    process.on('unhandledRejection', function(e){
        console.log(e);
    })
}

