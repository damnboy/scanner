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
    let message = JSON.parse(data);
    registerDNSProbe(message.task_id, message.target, message.dict)
})
//入库，整合提交到elasticsearch与task，进行whois查询
router.on('dns.trace', function(task_id, trace){
    log.info(task_id, trace)
})

router.on('dns.error', function(task_id, error){
    log.info(task_id, error)
})

router.on('dns.record.a', function(task_id, record){
    log.info(task_id, record)
})

router.on('dns.record.cname', function(task_id, record){
    log.info(task_id, record)
})

router.on('dns.finish', function(task_id, summary){
    log.info(task_id, summary)
})

function registerDNSProbe(task_id, target, dict_name){
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
            router.emit('dns.error', task_id, error);
        })
        prober.on('record.a', function(record){
            router.emit('dns.record.a', task_id, record);
        })
        prober.on('record.cname', function(record){
            router.emit('dns.record.cname', task_id, record);
        })
        
        prober.on('finish', function(summary){
            router.emit('dns.finish', task_id, summary);
        })
        prober.autoProbe(target, records);
    })
}

process.on("message", function(data){

    registerDNSProbe(data.task_id, data.target, data.dict);
})



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