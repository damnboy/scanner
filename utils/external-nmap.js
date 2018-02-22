var child_process = require("child_process");
var log = require('./logger').createLogger('[util:external-nmap]')
var path = require("./path.js");
var dbapi = require('../libs/db');
var events = require('events');
var util = require('util');
var bluebird = require('bluebird');
var settings = require('../settings');
var _ = require('lodash');
/*
    open
    syn,syn-ack,rst

    close
    syn,rst

    filtered 
    syn*n

    unfiltered
    ack扫描中出现的结果，需要使用window／syn／fin扫描来判断端口是否开放

    open|filtered
    udp，ip，FIN，NULL，Xmax扫描中主线


    close|filtered
    idle scan类型中出现
*/
function NmapSchedule(){
    events.EventEmitter.call(this);
    this.external_binary = 'nmap';
    this.chain = Promise.resolve('Nmap Schedule Started...');

}

util.inherits(NmapSchedule, events.EventEmitter);//使这个类继承EventEmitter

NmapSchedule.prototype.startNmap = function(){
    var self = this;
    this.chain = Promise.resolve(1)
    .then(function(result){
        //根据时间戳，从nmaptask索引中获取距离当前时间间隔最长的主机开放服务扫描任务
        return dbapi.getScheduledNmapTask(settings.nmap.concurrence)
        .then(function(tasks){
            return Promise.all(tasks.map(function(task){
                return self.scan({
                    ip : task.ip,
                    taskId : task.taskId
                })
                .then(function(hostInfo){
                    return dbapi.doneNmapTask(hostInfo);
                });
            }));
        })
        .then(function(doc){
            setTimeout(function(){
                self.startNmap();
            }, 5000); //nodejs消息队列有机会进行消息调度
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
     return Promise.all([this.chain]);
}

NmapSchedule.prototype.webScan = function(ti){
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
            '-p 80,8080,8000',
            '--min-rate', settings.nmap.rate
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


NmapSchedule.prototype.fastScan = function(ti){
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
            '-F',
            '--min-rate', settings.nmap.rate
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
            '--min-rate', settings.nmap.rate
        ]);

        log.info('start nmap task on host %s', taskInfo.ip);
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
                log.warn('nmap exit unexcepted with code: ' + code);
                reject(code);
            }
        })
    })
}

module.exports = new NmapSchedule();