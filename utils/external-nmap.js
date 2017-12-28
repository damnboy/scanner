var child_process = require("child_process");
var log = require('./logger').createLogger('[util:external-nmap]')
var path = require("./path.js");
var dbClient = require('../libs/db');
function NmapSchedule(){
    this.external_binary = 'nmap';
    this.chain = Promise.resolve('Nmap Schedule Started...');
}

NmapSchedule.prototype.start = function(dbapi){
    var self = this;
    this.chain
    .then(function(result){
        //根据时间戳，从nmaptask索引中获取距离当前时间间隔最长的主机开放服务扫描任务
        return dbapi.getScheduledNmapTask()
        .then(function(doc){
            return self.scan(doc)
        })
        .then(function(doc){
            log.info('scan result: ', doc);
            dbapi.doneNmapTask(doc)
            .then(function(){
                setTimeout(function(){
                    self.start(dbapi)
                }, 5000) //nodejs消息队列有机会进行消息调度
            })
            .catch(function(err){
                log.error('doneNmapTask ' + err)
                self.start(dbapi)
            })
        })
        .catch(function(err){
            log.error('getScheduledNmapTask ' + err)
            setTimeout(function(){
                self.start(dbapi)
            }, 5000)
        })
    })
}

NmapSchedule.prototype.wait = function(){
     return this.chain;
}

NmapSchedule.prototype.scan = function(doc){
    return new Promise(function(resolve, reject){
        var taskInfo = doc._source
        taskInfo.tcp = [];
        taskInfo.udp = []

        var proc = child_process.spawn(path.utils('bin/nmap-7.11'),[
            taskInfo.ip,
            '-vv',
            '-n',
            '-Pn',
            '-p 80,443',
            '--min-rate','1000'
        ]);

        proc.stdout.on('data', function(data){
            var output = data.toString('utf-8')
            var reg = /open port (\d*)\/(\w*)/g;
            var result = reg.exec(output, 'i');
            if(result){
                if(result[2] === 'tcp'){
                    taskInfo.tcp.push(result[1])
                }
                else if(result[2] === 'udp'){
                    taskInfo.udp.push(result[1])
                }
                else{
                    ;
                }
                log.info(taskInfo.ip + ' ' + result[1] + '/' + result[2]);
            }
            
        })

        proc.stderr.on('data', function(data){
            log.warn(data.toString('utf-8'))
        })

        proc.on('exit', function(code, signal){
            if(code === 0){
                doc._source = taskInfo;
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