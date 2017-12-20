var log = require('../utils/logger').createLogger('[daemon:domain]')
var EventEmitter = require("events").EventEmitter;
var DNSProber = require('../libs/dns').DNSProber;
var dict = require('../utils/dict');
var router = new EventEmitter();
var util = require("util");
var zmq = require("zmq");


var pub = zmq.socket("pub");
pub.bind(process.argv[3], function(err){
    log.info("Listening for zmq sub");
})

var sub = zmq.socket("sub");
sub.subscribe("");
sub.connect(process.argv[5]);

sub.on("message", function(data){
    let task_info = JSON.parse(data);
    registerDNSProbe(task_info.id, task_info.target_domain, task_info.dict)
    .then(function(summary){
        log.info(summary)
    })
    .catch(function(error){
        log.error('!' + error)
    })
})

/////////////////////////////////////////////////
//入库，整合提交到elasticsearch与task，进行whois查询
//入库操作提交到独立的进程内完成，将入库部分的逻辑独立
router.on('dns.trace', function(task_id, trace){
    log.info(task_id, trace)
})

router.on('dns.timeout', function(task_id, record){
    log.warn('timeout', record)
})
//pub到services与whois进行二阶扫描
router.on('dns.record.a', function(task_id, record){
    //log.info(task_id, record)
    pub.send(JSON.stringify({
        "task_id" : task_id,
        "record" : record
    }))
})

router.on('dns.record.cname', function(task_id, record){
    //log.info(task_id, record)
})


function registerDNSProbe(task_id, target, dict_name){
    return new Promise(function(resolve, reject){
        dict.getDNSDict(dict_name)
        .then(function(records){
            log.info(util.format("Got %d records from dict: %s", records.length, dict_name));
            var prober = new DNSProber();
            prober.on('failed', function(trace){
            
                var nameservers = trace[trace.length - 1].reduce(function(ret, record){
                    return ret.concat(record.ip)
                }, [])
                prober.manualProbe(target, nameservers, records)
            })
            prober.on('trace', function(trace){
                router.emit('dns.trace', task_id, trace);
            })
            
            prober.on('error', function(error){
                reject(error)
            })

            prober.on('timeout', function(record){
                
                router.emit('dns.timeout', task_id, record);
            })

            prober.on('record.a', function(record){
                router.emit('dns.record.a', task_id, record);
            })

            prober.on('record.cname', function(record){
                router.emit('dns.record.cname', task_id, record);
            })
            
            prober.on('finish', function(summary){
                resolve(summary)
            })

            prober.autoProbe(target, records);
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