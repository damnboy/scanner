var log = require('../utils/logger').createLogger('[daemon:domain]')
var EventEmitter = require("events").EventEmitter;
var DNSProber = require('../libs/dns').DNSProber;
var dict = require('../utils/dict');
var wire = require("./wire");
var wirerouter = require("./wire/router.js")
var wireutil = require("./wire/util.js")
var util = require("util");
var zmq = require("zmq");
var dbapi = require('../libs/db');

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
        .on(wire.ClientReady, function(channel, message, data){
            log.info("Got domain scan task(" + message.taskId + ")...");
            dbapi.getDomainTask(message.taskId)
            .then(function(taskInfo){
                console.log(taskInfo);
                registerDNSProbe(taskInfo.id, taskInfo.targetDomain, taskInfo.dict, taskInfo.customNameservers);
            });
        })
        .handler()
    );

    var router = new EventEmitter();
    function registerDNSProbe(task_id, target, dict_name, customNameservers){
        return new Promise(function(resolve, reject){
            dict.getDNSDict(dict_name)
            .then(function(records){
                log.info(util.format("Got %d records from dict: %s", records.length, dict_name));
                var prober = new DNSProber();
                prober.on('failed', function(trace){
                
                    var nameservers = trace[trace.length - 1].reduce(function(ret, record){
                        return ret.concat(record.ip);
                    }, []);
                    prober.manualProbe(target, nameservers, records);
                });

                prober.on('trace', function(trace){
                    router.emit('dns.trace', task_id, trace);
                });
                
                prober.on('error', function(error){
                    reject(error);
                });

                prober.on('timeout', function(record){
                    router.emit('dns.timeout', task_id, record);
                });

                prober.on('response', function(response){
                    router.emit('dns.response', task_id, response);
                });

                prober.on('record.a', function(record){
                    router.emit('dns.record.a', task_id, record);
                });

                prober.on('record.cname', function(record){
                    router.emit('dns.record.cname', task_id, record);
                });
                
                prober.on('finish', function(summary){
                    resolve(summary);
                });

                if(customNameservers !== undefined && customNameservers.length === 0){
                    prober.autoProbe(target, records);
                }
                else{
                    prober.manualProbe(target, customNameservers, records);
                }
            });
        });
    }


    /////////////////////////////////////////////////
    //入库，整合提交到elasticsearch与task，进行whois查询
    //入库操作提交到独立的进程内完成，将入库部分的逻辑独立
    
    router.on('dns.trace', function(task_id, trace){
        log.info(task_id, trace);
    });

    router.on('dns.timeout', function(task_id, record){
        log.warn('timeout', record);
    });
    /*
        { 
            domain: 'mail.189.cn',
            cname: [ 'webmail.189.cn', '189.webmail.21cn.com' ],
            a: [],
            resolver: '118.85.203.178',
            task_id: '833f3b90-ec69-11e7-8ff5-fd62b8b82915',
            create_date: 1514532360820,
            description: 'description',
            remark: 'remark' 
        }
    */
    router.on('dns.response', function(task_id, response){
        response.task_id = task_id;
        dbapi.saveDNSRecord(response);
        if(response.cname.length > 0){
            push.send([task_id, wireutil.envelope(wire.ScanResultDNSRecordCName,{
                "domain" : response.domain,
                "data" : response.cname
            })]);
        }
        if(response.a.length > 0){
            push.send([task_id, wireutil.envelope(wire.ScanResultDNSRecordA,{
                "domain" : response.domain,
                "data" : response.a
            })]);
        }
    });

    //pub到services与whois进行二阶扫描
    router.on('dns.record.a', function(task_id, record){
        //入库.then(push.send)
        push.send([task_id, wireutil.envelope(wire.IPv4Infomation,{
            "ip" : record.data
        })]);
    });

    router.on('dns.record.cname', function(task_id, record){
        //log.info(task_id, record)
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
    });

    process.on("SIGTERM", function(){
        closeSocket();
    });
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