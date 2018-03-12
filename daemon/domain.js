var log = require('../utils/logger').createLogger('[daemon:domain]')
var EventEmitter = require("events").EventEmitter;
var DNSBurster = require('../libs/dns');
var dict = require('../utils/dict');
var wire = require("./wire");
var wirerouter = require("./wire/router.js")
var wireutil = require("./wire/util.js")
var util = require("util");
var zmq = require("zmq");
var dbapi = require('../libs/db');
var _ = require('lodash');

module.exports.command = 'domain';

module.exports.describe = 'domain';

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
    sub.identity = "domain";
    sub.subscribe("");
    argvs.connectSub.forEach(function(endpoint){
        sub.connect(endpoint);
    });
    
    sub.on("message", wirerouter()
        .on(wire.DomainTaskReady, function(channel, message, data){
            log.info("Got domain scan task(" + message.id + ")...");
            Promise.resolve(message)
            .then(function(taskInfo){
                return registerDNSProbe(taskInfo.id, taskInfo.targetDomain, taskInfo.dict, taskInfo.customNameservers)
                .then(function(summary){
                    log.info(taskInfo.targetDomain);
                    log.info(summary);

                    return dbapi.scheduleNmapServiceTasks(taskInfo.id, hosts);

                });
            })
            .catch(function(err){
                log.error(err);
            });
        })
        .on(wire.MixTaskReady, function(channel, message, data){      
            if(message.domains.length > 0){
                //message.domain字段调用公共dns服务器进行解析
                registerPublicDNSProbe(message.id, message.domains)
                .then(function(summary){
                    log.info(summary);

                    return dbapi.scheduleNmapServiceTasks(message.id, message.hosts);

                });
            }            
        })
        .handler()
    );

    var router = new EventEmitter();
    function registerPublicDNSProbe(taskId, domains){
        return new Promise(function(resolve, reject){
            var dns = new DNSBurster();
            
            dns.on('error', function(error){
                reject(error);
            });

            dns.on('timeout', function(record){
                router.emit('dns.timeout', taskId, record);
            });

            dns.on('response', function(response){
                router.emit('dns.response', taskId, response);
            });

            dns.on('finish', function(summary){
                resolve(summary);
            });

            dns.burstDomains(domains, ['223.5.5.5'], []);
        });
    }
    function registerDNSProbe(taskId, target, dict_name, customNameservers){
        return new Promise(function(resolve, reject){
            dict.getDNSDict(dict_name)
            .then(function(records){
                log.info(util.format("Got %d records from dict: %s", records.length, dict_name));
                var dns = new DNSBurster();
                dns.on('failed', function(trace){
                    var nameservers = trace[trace.length - 1].reduce(function(ret, record){
                        return ret.concat(record.ip);
                    }, []);
                    prober.burstTargetDomain(target, records, nameservers);
                });

                dns.on('trace', function(trace){
                    router.emit('dns.trace', taskId, trace);
                });
                
                dns.on('error', function(error){
                    reject(error);
                });

                dns.on('timeout', function(record){
                    router.emit('dns.timeout', taskId, record);
                });

                dns.on('response', function(response){
                    router.emit('dns.response', taskId, response);
                });

                dns.on('finish', function(summary){
                    resolve(summary);
                });

                dns.burstTargetDomain(target, records, customNameservers);
            });
        });
    }


    /////////////////////////////////////////////////
    //入库，整合提交到elasticsearch与task，进行whois查询
    //入库操作提交到独立的进程内完成，将入库部分的逻辑独立
    
    router.on('dns.trace', function(taskId, trace){
        log.info(taskId, trace);
    });

    router.on('dns.timeout', function(taskId, record){
        log.warn('timeout', record);
    });

    router.on('dns.response', function(taskId, response){
        response.taskId = taskId;
        
        dbapi.saveDNSRecord(response);
        if(response.cname.length > 0){
            push.send([taskId, wireutil.envelope(wire.ScanResultDNSRecordCName,{
                "domain" : response.domain,
                "data" : response.cname
            })]);
        }
        if(response.a.length > 0){
            push.send([taskId, wireutil.envelope(wire.ScanResultDNSRecordA,{
                "domain" : response.domain,
                "data" : response.a
            })]);

            response.a.forEach(function(a){
                push.send([taskId, wireutil.envelope(wire.IPv4Infomation,{
                    "ip" : a
                })]);
            });
        }
    });

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
        closeSocket();
        process.exit(0);
    });

    process.on("SIGTERM", function(){
        closeSocket();
        process.exit(0);
    });


    process.on('unhandledRejection', function(err){
        console.log('---');
        console.log(err)
    })
};








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