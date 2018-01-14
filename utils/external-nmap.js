var child_process = require("child_process");
var log = require('./logger').createLogger('[util:external-nmap]')
var path = require("./path.js");
var dbapi = require('../libs/db');
var events = require('events');
var util = require('util');
var bluebird = require('bluebird');

function NmapSchedule(){
    events.EventEmitter.call(this);
    this.external_binary = 'nmap';
    this.chain = Promise.resolve('Nmap Schedule Started...');
    this.chainBanner = Promise.resolve('Banner Schedule Started...');
}

util.inherits(NmapSchedule, events.EventEmitter);//使这个类继承EventEmitter

NmapSchedule.prototype.startBanner = function(){
    var self = this;
    this.chain
    .then(function(result){
        //根据时间戳，从nmaptask索引中获取距离当前时间间隔最长的主机开放服务扫描任务
        return dbapi.getScheduledBannerTask()
    })
    .then(function(doc){
        var serviceInfo = doc._source;
        return self.portBanner(serviceInfo)
        .then(function(bannerInfo){
            dbapi.doneBannerTask(bannerInfo, doc._id)
            .then(function(){
                setTimeout(function(){
                    self.startBanner()
                }, 5000) //nodejs消息队列有机会进行消息调度
            })
            .catch(function(err){
                log.error('doneBannerTask ' , err);
                self.startBanner();
            })
        })
    })
    .catch(function(err){
        log.error('getScheduledBannerTask ' + err);
        setTimeout(function(){
            self.startBanner();
        }, 5000);
    })
    
}

NmapSchedule.prototype.startNmap = function(){
    var self = this;
    this.chain
    .then(function(result){
        //根据时间戳，从nmaptask索引中获取距离当前时间间隔最长的主机开放服务扫描任务
        return dbapi.getScheduledNmapTask()
        .then(function(doc){
            return self.scan(doc._source)
            .then(function(hostInfo){
                return dbapi.doneNmapTask(hostInfo, doc._id);
            })
        })
        .then(function(doc){
            setTimeout(function(){
                self.startNmap()
            }, 5000) //nodejs消息队列有机会进行消息调度
        })
        .catch(function(err){
            log.error('getScheduledNmapTask ' + err);
            setTimeout(function(){
                self.startNmap();
            }, 5000);
        })
    })
}

NmapSchedule.prototype.wait = function(){
     return Promise.all([this.chain, this.chainBanner]);
}

/*
-sV --version-trace --version-all

Service scan match (Probe NULL matched with NULL line 3487): 198.177.122.30:22 is ssh.  Version: |OpenSSH|6.4|protocol 2.0|

.match(/ is ([\w]*).\s*Version:\s([^\s]*)/)
*/

NmapSchedule.prototype.portBanner = function(serviceInfo){

    var self = this;
    return new Promise(function(resolve, reject){

        var bannerInfo = {
            "service" : "UNKNOWN",
            "version" : "UNKNOWN",
            "sslSupport" : false,
            "scannedBy" : "nmap",
            "raw" : Buffer.from("", 'utf8').toString('base64')
        }

        var proc = child_process.spawn('nmap',[
            serviceInfo.ip,
            '-vv',
            '-n',
            '-sV',
            '--version-trace',
            '--version-all',
            '-Pn',
            '-p', serviceInfo.port,
            '--min-rate','1000'
        ]);
        log.info(serviceInfo.ip, serviceInfo.port, serviceInfo.type)
        
        proc.stdout.on('data', function(data){
            var output = data.toString('utf-8').split('\n');
            var reg = /\d*\/tcp]*\s*open\s*([a-z\/\-]*)\s*syn-ack*\s*(?:ttl)?\s?(?:\d*)?([\w\W]*)$/g;
            output.forEach(function(line){
                    var r = reg.exec(line, 'i');
                    if(r){
                        bannerInfo["service"] = r[1].split('/').reverse()[0];
                        bannerInfo["sslSupport"] = r[1].split('/').length > 1;
                        bannerInfo["version"] = r[2];
                        bannerInfo["raw"] = Buffer.from(line, 'utf8').toString('base64');
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
    .catch(function(err){
        log.error('portBanner' + err)
    })
}

NmapSchedule.prototype.scan = function(ti){
    var self = this;
    return new Promise(function(resolve, reject){
        var taskInfo = ti;
        taskInfo.tcp = [];
        taskInfo.udp = [];


        var proc = child_process.spawn('nmap',[
            taskInfo.ip,
            '-vv',
            '-n',
            '-Pn',
            '-p-',
            '--min-rate','2000'
        ]);

        proc.stdout.on('data', function(data){
            var output = data.toString('utf-8');
            var reg = /open port (\d*)\/(\w*)/g;
            var result = reg.exec(output, 'i');
            if(result){
                var port = parseInt(result[1]);
                if(result[2] === 'tcp'){
                    taskInfo.tcp.push(port);
                    self.emit('tcp', taskInfo['taskId'], taskInfo.ip, port);
                }
                else if(result[2] === 'udp'){
                    taskInfo.udp.push(port);
                    self.emit('udp', taskInfo['taskId'], taskInfo.ip, port);
                }
                else{
                    ;
                }
                log.info(taskInfo.ip + ' ' + port + '/' + result[2]);
            }
        })

        proc.stderr.on('data', function(data){
            log.warn(data.toString('utf-8'));
        })

        proc.on('exit', function(code, signal){
            if(code === 0){
                self.emit('host', taskInfo['taskId'], taskInfo.ip, taskInfo.tcp, taskInfo.udp);
                resolve(taskInfo)
            }
            else{
                log.warn('nmap exit unexcepted with code: ' + code)
                reject(code);
            }
        })
    })
}

module.exports = new NmapSchedule();