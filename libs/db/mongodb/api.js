module.exports = function(options){

    var db = require('./conn')(options);
    var DBApi = require('../api');
    var util = require("util");
    var log = require('../../../utils/logger').createLogger('[db:mongodb]');
    var _ = require("lodash");

    //o为protocolbuffer对象，无法完成到bson对象的序列化操作。
    DBApi.prototype.stripObject = function(o){
        return Object.keys(o).reduce(function(r, key){
            r[key] = o[key];
            return r;
        },{});
    };

    DBApi.prototype.saveDomainTask = function(taskInfo){
        var self = this;
        return db.connect().then(function(d){
            return d.db('vector').collection('tasks').insertOne(self.stripObject(taskInfo));
        });
    };

    DBApi.prototype.saveMixTask = function(taskInfo){
        var self = this;
        return db.connect().then(function(d){
            return d.db('vector').collection('tasks').insertOne(self.stripObject(taskInfo));
        });
    };

    DBApi.prototype.saveWhoisRecord = function(record){
        return db.connect()
        .then(function(d){
            d.db('vector').collection('whois').insertOne(record);
        });
    };

    DBApi.prototype.saveDNSRecord =  function (dnsRecord){
        var data = this.stripObject(dnsRecord);
        data.createDate = Date.now();
        data.description = 'description';
        data.remark = 'remark';
        
        return db.connect().then(function(d){
            return d.db('vector').collection('dnsrecords').insertOne(data);
        });
    };

    DBApi.prototype.getHosts = function(taskId){
        return db.connect().then(function(d){
            return new Promise(function(resolve, reject){
                d.db('vector').collection('dnsrecords')
                .find({taskId : taskId}, {'a.0' : {$exists:true}})
                .showRecordId(false)
                .toArray(function(err, records){
                    if(err){
                        reject(err);
                    }
                    else{
                        resolve(_.uniq(records.reduce(function(r, record){
                            return r.concat(record.a);
                        }, [])));
                    }
                });
            });
        });
    };

    DBApi.prototype.scheduleNmapServiceTasks = function(taskId, extHosts){
        return this.getHosts(taskId)
        .then(function(hosts){
            hosts = _.union(hosts, extHosts);
            if(hosts.length <= 0 ){
                log.warn('no valid hosts found on task(%s)', taskId);
            }
            else{
                log.info('Bulking ip addresses(' + hosts.length + ') of task(' + taskId + ') into service scanning...');

                return db.connect().then(function(d){
                    return d.db('vector').collection('services').insertMany(hosts
                        .map(function(host){
                            return {
                                "createDate" : Date.now() ,
                                "done" : false,
                                "ip" : host,
                                "taskId" : taskId
                            };
                        }));
                });
            }
        });  
    };

    DBApi.prototype.getScheduledNmapTask = function(size){
        return db.connect().then(function(d){
            return new Promise(function(resolve, reject){
                d.db('vector').collection('services')
                .find({done:false})
                .limit(size)
                .showRecordId(false)
                .toArray(function(err, records){
                    if(err){
                        reject(err);
                    }
                    else{
                        resolve(records.map(function(r){
                            delete r._id;
                            return r;
                        }));
                    }
                });
            });
        });      
    };


    DBApi.prototype.doneNmapTask = function(hostInfo){
        return db.connect().then(function(d){
            return d.db('vector').collection('services')
            .updateMany(
                {
                    ip : hostInfo.ip, 
                    taskId : hostInfo.taskId
                }, 
                { '$set' : 
                    {
                        tcp: hostInfo.tcp,
                        done : true,
                        scannedDate : Date.now()
                    }
                }
            );
        });
    };

    DBApi.prototype.scheduleBannerTasks = function(ip, ports, type, taskId){
        return Promise.resolve(ports)
        .then(function(ports){
            if(ports.length <= 0 ){
                log.warn('no valid ports found on %s', ip);
            }
            else{
                log.info('Bulking banner tasks('+ ports.length +') on ' + ip + ' into banner scanning...');

                return db.connect().then(function(d){
                    return d.db('vector').collection('banners').insertMany(ports
                        .map(function(port){
                            return {
                                "ip" : ip,
                                "port" : port,
                                "type" : type,
                                "taskId" : taskId,
                                "createDate" : Date.now(),
                                "done" : false,
                                "description" : 'description',
                                "remark" : 'remark',
                                "service" : '-',
                                "version" : '-',
                                "sslSupport" : false,
                                "scannedBy" : '-',
                                "raw" : Buffer.from("", 'utf8').toString('base64')
                            };
                        }));
                });
            }
        });
    };



    DBApi.prototype.getScheduledServiceBannerTask = function(type, size){
        return db.connect().then(function(d){
            return new Promise(function(resolve, reject){
                d.db('vector').collection('banners')
                .find({
                    scannedBy : type,
                    done : false
                })
                .limit(size)
                .toArray(function(err, records){
                    if(err){
                        reject(err);
                    }
                    else{
                        resolve(records.map(function(r){
                            delete r._id;
                            return r;
                        }));
                    }
                });
            });
        });
    };

    DBApi.prototype.doneScheduledServiceBannerTask = function(taskInfo){
        var query = {
            ip : taskInfo.ip,
            port : taskInfo.port,
            taskId : taskInfo.taskId
        };
        
        return db.connect().then(function(d){
            return d.db('vector').collection('banners')
            .updateMany(
                query, {"$set" : taskInfo}
            );
        });
    };

    DBApi.prototype.saveSSLCert = function(sslHostInfo){
        return db.connect().then(function(d){
            return d.db('vector').collection('sslcerts').insertOne(sslHostInfo);
        }); 
    };

    DBApi.prototype.getScheduledSSLBannerTasks = function(){
        return this.getScheduledServiceBannerTask('-', 16);
    };

    DBApi.prototype.doneScheduledSSLBannerTask = function(taskInfo){
        return this.doneScheduledServiceBannerTask(taskInfo, 'ssl');
    };

    DBApi.prototype.saveWebInfo = function(webInfo){
        return db.connect().then(function(d){
            return d.db('vector').collection('webs').insertOne(webInfo);
        });
    };

    DBApi.prototype.getScheduledWebBannerTasks = function(){
        return this.getScheduledServiceBannerTask('ssl', 16);
    };

    DBApi.prototype.doneScheduledWebBannerTask = function(taskInfo){
        return this.doneScheduledServiceBannerTask(taskInfo, 'web');
    };

    DBApi.prototype.getScheduledNmapBannerTasks = function(){
        return this.getScheduledServiceBannerTask('web', 1);
    };

    DBApi.prototype.doneScheduledNmapBannerTask = function(taskInfo){
        return this.doneScheduledServiceBannerTask(taskInfo, 'nmap');
    };

    return DBApi;
};