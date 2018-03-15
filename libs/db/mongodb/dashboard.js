var settings = require('../../../settings');
var db = require('./conn')(settings.db.mongodb);
var util = require("util");
var log = require('../../../utils/logger').createLogger('[db:mongodb]');
var _ = require("lodash");
function Dashboard(){
}


Dashboard.prototype.getTasks = function(){
    return db.connect()
    .then(function(d){
        //https://stackoverflow.com/questions/9040161/mongo-order-by-length-of-array
        return d.db('vector').collection('tasks').find({});
    })
    .then(function(records){
        return records.toArray();
    })
}

Dashboard.prototype.getHosts = function(taskId){
    return db.connect()
    .then(function(d){
        //https://stackoverflow.com/questions/9040161/mongo-order-by-length-of-array
        return d.db('vector').collection('services').aggregate([
            { "$match": { "taskId" : taskId } },
            {
                "$project" : { 
                    ip:1,
                    tcp:1,
                    tcp_count: {$size: { "$ifNull": [ "$tcp", [] ] } } 
                }
            }, 
            { "$sort": {"tcp_count":-1}}
        ])
    })
    .then(function(records){
        return records.toArray();
    })
}
Dashboard.prototype.getServices = function(taskId, ip){
    return db.connect()
    .then(function(d){
        //https://stackoverflow.com/questions/9040161/mongo-order-by-length-of-array
        return d.db('vector').collection('services').find({
            taskId:taskId,
            ip:ip
        })
    })
    .then(function(records){
        return records.toArray();
    })
}
Dashboard.prototype.getBanner = function(taskId, ip, port){
    return db.connect()
    .then(function(d){
        //https://stackoverflow.com/questions/9040161/mongo-order-by-length-of-array
        return d.db('vector').collection('banners').find({
            taskId : taskId,
            ip : ip,
            port : parseInt(port)
        })
    })
    .then(function(records){
        return records.toArray();
    })
}
module.exports = new Dashboard();