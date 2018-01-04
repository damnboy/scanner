/*
    interfaces about db access
*/
function DBApi(){

}

DBApi.prototype.saveDNSRecord = function(){

}

DBApi.prototype.queryDNSRecord = function(){
    
}

DBApi.prototype.analyzeDNSRecord = function(){
    
}

DBApi.prototype.getAllDomainTasks = function(){
    
}
DBApi.prototype.getDomainTask = function(){
    return Promise.resolve(200);
}

DBApi.prototype.saveDomainTask = function(){
    return Promise.resolve(200);
}

DBApi.prototype.saveWhoisRecord = function(){
    
}

DBApi.prototype.scheduleNmapTask = function(){

}

DBApi.prototype.getScheduledNmapTask = function(){
    return Promise.reject(500);
    
}

module.exports = DBApi;
/*
var fake = require('./raw.js');
module.exports = Object.keys(fake).reduce(function(obj, fun){
    obj[fun] = function(){

    }
    return obj
}, {})
*/