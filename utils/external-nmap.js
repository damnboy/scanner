var child_process = require("child_process");
var log = require('./logger').createLogger('[util:external-nmap]')
var path = require("./path.js");
var dbapi = require('../libs/db');
var events = require('events');
var util = require('util');

function NmapSchedule(){
    events.EventEmitter.call(this);
    this.external_binary = 'nmap';
    this.chain = Promise.resolve('Nmap Schedule Started...');
}

util.inherits(NmapSchedule, events.EventEmitter);//使这个类继承EventEmitter

NmapSchedule.prototype.start = function(){
    var self = this;
    this.chain
    .then(function(result){
        //根据时间戳，从nmaptask索引中获取距离当前时间间隔最长的主机开放服务扫描任务
        return dbapi.getScheduledNmapTask()
        .then(function(doc){
            return self.scan(doc);
        })
        .then(function(doc){
            dbapi.doneNmapTask(doc)
            .then(function(){
                setTimeout(function(){
                    self.start()
                }, 5000) //nodejs消息队列有机会进行消息调度
            })
            .catch(function(err){
                log.error('doneNmapTask ' + err);
                self.start();
            })
        })
        .catch(function(err){
            log.error('getScheduledNmapTask ' + err);
            setTimeout(function(){
                self.start();
            }, 5000);
        })
    })
}

NmapSchedule.prototype.wait = function(){
     return this.chain;
}

/*
-sV --version-trace --version-all

Service scan match (Probe NULL matched with NULL line 3487): 198.177.122.30:22 is ssh.  Version: |OpenSSH|6.4|protocol 2.0|

.match(/ is ([\w]*).\s*Version:\s([^\s]*)/)
*/

NmapSchedule.prototype.portBanner = function(ip, port){

    var self = this;
    return new Promise(function(resolve, reject){
        var bannerInfo = {
            "ip" : ip,
            "port" : port,
            "service" : "UNKNOWN",
            "version" : "UNKNOWN",
            "sslSupport" : false,
            "scanedBy" : "nmap",
            "raw" : ""
        }

        var proc = child_process.spawn('nmap',[
            ip,
            '-vv',
            '-n',
            '-sV',
            '--version-trace',
            '--version-all',
            '-Pn',
            '-p', port,
            '--min-rate','2000'
        ]);
        
        proc.stdout.on('data', function(data){
            var output = data.toString('utf-8').split('\n');
            var reg = /\d*\/tcp]*\s*open\s*([a-z\/\-]*)\s*syn-ack*\s*(?:ttl)?\s?(?:\d*)?([\w\W]*)$/g;
            output.forEach(function(line){
                    var r = reg.exec(line, 'i');
                    if(r){
                        bannerInfo.service = r[1].split('/').reverse()[0];
                        bannerInfo.sslSupport = r[1].split('/').length > 1;
                        bannerInfo.version = r[2];
                        bannerInfo.raw = Buffer.from(line, 'utf8' );
                    }
            })
        })

        proc.stderr.on('data', function(data){
            var output = data.toString('utf-8');
            if(!output.match(/NSOCK/)){
                log.warn(output);
            }
        })

        proc.on('exit', function(code, signal){
            if(code === 0){
                resolve(bannerInfo);
            }
            else{
                log.warn('nmap exit unexcepted with code: ' + code)
                reject(code);
            }
        })
    })
}

NmapSchedule.prototype.scan = function(doc){
    var self = this;
    return new Promise(function(resolve, reject){
        var taskInfo = doc._source
        taskInfo.tcp = [];
        taskInfo.udp = [];


        var proc = child_process.spawn('nmap',[
            taskInfo.ip,
            '-vv',
            '-n',
            '-Pn',
            //'-p-',
            '--min-rate','2000'
        ]);

        proc.stdout.on('data', function(data){
            var output = data.toString('utf-8')
            var reg = /open port (\d*)\/(\w*)/g;
            var result = reg.exec(output, 'i');
            if(result){
                if(result[2] === 'tcp'){
                    taskInfo.tcp.push(result[1])
                    self.emit('tcp', taskInfo['task_id'], taskInfo.ip, result[1]);
                }
                else if(result[2] === 'udp'){
                    taskInfo.udp.push(result[1])
                    self.emit('udp', taskInfo['task_id'], taskInfo.ip, result[1]);
                }
                else{
                    ;
                }
                log.info(taskInfo.ip + ' ' + result[1] + '/' + result[2]);
            }
        })

        proc.stderr.on('data', function(data){
            log.warn(data.toString('utf-8'));
        })

        proc.on('exit', function(code, signal){
            if(code === 0){
                doc._source = taskInfo;
                self.emit('host', taskInfo['task_id'], taskInfo.ip, taskInfo.tcp, taskInfo.udp);
                resolve(doc)
            }
            else{
                log.warn('nmap exit unexcepted with code: ' + code)
                reject(code);
            }
        })
    })
}

module.exports = new NmapSchedule();