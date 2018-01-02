var request = require('request');
var _ = require('lodash');
var util = require('util');
var log = require('../../../utils/logger.js');
var logger = log.createLogger('[DB-CLIENT-SQLITE3');
module.exports = function(options){
    
    function DBClient(){
        this.tasks = [];
        this.dnsrecords = [];
        this.whois = [];
        this.services = [];
        this.servicebanners = [];
    }

    return new Promise(function(resolve, reject){

        DBClient.prototype.getDomainTask = function(id){
            var self = this;
            return new Promise(function(resolve, reject){   
                logger.info(self.tasks)
                var matchedTasks = self.tasks.reduce(function(result, task){
                    logger.info(task)
                    if(task.id === id){
                        result.push(task);
                    }
                    return result;
                }, []);
                logger.info(matchedTasks);
                if(matchedTasks.length > 0){
                    resolve(matchedTasks[0]);
                }
                else{
                    reject(500);
                }
            });
        };

        DBClient.prototype.saveDomainTask = function(taskInfo){
            var self = this;
            return new Promise(function(resolve, reject){   
                self.tasks.push(taskInfo);
                logger.info(self.tasks);
                resolve(self.tasks.length);
            })
        }

        DBClient.prototype.doneNmapTask = function(doc){
            return new Promise(function(resolve, reject){   
                resolve(1);
            })
        }
        //els排序
        DBClient.prototype.getScheduledNmapTask = function(){
            //TODO 清空servicebanner中对应任务下的banner记录
            var self = this;
            return new Promise(function(resolve, reject){

                var host = self.services.reduce(function(result, service){
                    if(!service.done){
                        result.push(service);
                    }
                    return result;
                },[]);

                if(host.length > 0){
                    resolve(host[0]);
                }
                else{
                    reject(500);
                }
            })
        }

        DBClient.prototype.scheduleNmapTask = function(record){
            services.push(_.assign(record , 
                {
                    '_id' : services.length,
                    'create_date' : Date.now() ,
                    'done' : false
                }
            ));
        }

        DBClient.prototype.saveWhoisRecord = function(record){
            whois.push(_.assign(record , 
                {
                    'create_date' : Date.now() ,
                    'description' : 'description',
                    'remark' : 'remark'
                }));
        };
        /*
        domain 会被elasticsearch引擎的分词器拆分，domain字段的检索变成全文检索，导致搜索结果不唯一
        搜索结果中包含权重值 "_score":         0.16273327, 
    
        */
        DBClient.prototype.saveDNSRecord =  function (record){
            dnsrecords.push(_.assign(record , 
                {
                    'create_date' : Date.now() ,
                    'description' : 'description',
                    'remark' : 'remark'
                }
            ));
        };
    
        logger.info('memory client is ready');
        resolve(new DBClient());
    });
};
