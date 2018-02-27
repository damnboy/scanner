/*
webpage处理SSLHost与NonSSLHost

error事件中的主机全部发往nmapbanner进行处理
成功响应的主机执行简单的web扫描

get /
get /robots.txt
top1000 路径爆破
header保存
options

*/


var log = require('../../../utils/logger').createLogger('[daemon:banner:web]');
var util = require("util");
var zmq = require("zmq");
var wire = require("../../wire");
var wirerouter = require("../../wire/router.js");
var wireutil = require("../../wire/util.js");
var dbapi = require('../../../libs/db');
var WebBanner = require('../../../libs/http/banner');

module.exports.command = 'bannerweb';
module.exports.describe = 'bannerweb';

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
    sub.identity = "bannerweb";
    sub.subscribe("");
    argvs.connectSub.forEach(function(endpoint){
        sub.connect(endpoint);
    });

    var web = new WebBanner();
    web.on('web', function(options){
        var webInfo = {
            host : options.host,
            port : options.port,
            ssl : options.ssl, 
            get :{
                statusCode : options.statusCode,
                title : options.title,
                headers : options.headers 
            }
        };

        dbapi.saveWebInfo(webInfo)
        .then(function(){
            return dbapi.doneScheduledWebBannerTask({
                scannedBy : 'web',
                ip : options.host,
                port : options.port,
                taskId : options.taskId,
                service : 'http',
                version : options.headers.server || '',
                done : true
            });
        })
        .catch(function(err){
            log.error(err);
        });
    });

    web.on('nonWeb', function(options){
        dbapi.doneScheduledWebBannerTask({
            scannedBy : 'web',
            done : false,
            ip : options.host,
            port : options.port,
            taskId : options.taskId
        })
        .catch(function(err){
            log.error(err);
        });
    });

    web.on('empty', function(){
        schedule(5000);
    });

    var timer;
    function schedule(timeout){
        //timer释放问题
        timer = setTimeout(function(){
            dbapi.getScheduledWebBannerTasks()
            .then(function(tasks){
                if(tasks.length === 0){
                    //log.info('http scan queue is empty');
                    schedule(5000);
                }
                else{
                    web.scanHosts(
                        tasks.map(function(t){
                            return {
                                ssl : t.sslSupport,
                                host : t.ip,
                                port : t.port,
                                taskId : t.taskId
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
        })
    }

    process.on("SIGINT", function(){
        Promise.resolve()
        .then(function(){
            clearTimeout(timer);
            closeSocket();
            process.exit(0);
        })
        
    })

    process.on("SIGTERM", function(){
        Promise.resolve()
        .then(function(){
            clearTimeout(timer);
            closeSocket();
            process.exit(0);
        })
    })
}

