var log = require('../utils/logger').createLogger('[daemon:service]')
var util = require("util");
var zmq = require("zmq");
var wire = require("./wire");
var wirerouter = require("./wire/router.js")
var wireutil = require("./wire/util.js")
var Queue = require("../utils/queue.js")
var NmapSchedule = require('../utils/external-nmap.js');
var dbapi = require('../libs/db');

module.exports.command = 'service';
module.exports.describe = 'service';
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
   
    var push = zmq.socket("push");
    push.connect(argvs.connectPull);

    var sub = zmq.socket("sub");
    sub.identity = "services";
    sub.subscribe("");
    argvs.connectSub.forEach(function(endpoint){
        sub.connect(endpoint);
    })
    
    
    NmapSchedule.on('tcp', function(taskId, ip, port){
        /*
        push.send([taskId, wireutil.envelope(wire.ServiceInformation, {
            "ip" : ip,
            "type" : "tcp",
            "ports" : [port],
            "scan" : false
        })]);
        */
    });

    NmapSchedule.on('udp', function(taskId, ip, port){
        /*
        push.send([taskId, wireutil.envelope(wire.ServiceInformation, {
            "ip" : ip,
            "type" : "udp",
            "ports" : [port],
            "taskId" :taskId
        })]);
        */
    });
    

    NmapSchedule.on('host', function(taskId, ip, tcp, udp){
        //扫描结果入库存储，高仿节点返回大量开放端口，因此端口数量大于100的主机，跳过不执行扫描
        if(tcp.length === 0){
            log.warn('Host %s down', ip);
        }
        else if(tcp.length > 60){
            log.warn('Too many open service on host %s, seems hosted on highly defence cloud service', ip);
        }
        else{
            push.send([taskId, wireutil.envelope(wire.ServiceInformation, {
                "ip" : ip,
                "tcpPorts" : tcp,
                "udpPorts" : udp,
                "taskId" :taskId
            })]);
        }
    });

    NmapSchedule.startNmap();

    sub.on("message", wirerouter()
        .on(wire.ScanResultDNS, function(channel, message, data){
            
            var taskId = channel.toString('utf-8');
            log.info('Bulking ip addresses of task(' + taskId + ') into service scanning...');

            dbapi.getHosts(taskId)
            .then(function(hosts){

                return hosts.map(function(host){
                    return {
                        "createDate" : Date.now() ,
                        "done" : false,
                        "ip" : host,
                        "taskId" : taskId
                    }
                });
            })
            .then(function(records){

                var bulkBody = records.reduce(function(bulk, record){
                    bulk.push(JSON.stringify({ "index":{ "_index": "services", "_type": "doc" } }));
                    bulk.push(JSON.stringify(record));
                    return bulk;
                },[])

                dbapi.executeBulk('services', bulkBody.join('\n') + '\n')
                .then(function(result){
                    console.log(result);
                })
            })
            .catch(function(err){
                console.log(err);
            })

        })
        .on(wire.IPv4Infomation, function(channel, message, data){


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