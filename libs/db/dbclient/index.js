/*
    interfaces about db access
*/
function DBClient(){

}

DBClient.prototype.saveDNSRecord = function(){

}

DBClient.prototype.queryDNSRecord = function(){
    
}

DBClient.prototype.analyzeDNSRecord = function(){
    
}

DBClient.prototype.getDomainTask = function(){
    return Promise.resolve(200);
}

DBClient.prototype.saveDomainTask = function(){
    return Promise.resolve(200);
}

DBClient.prototype.saveWhoisRecord = function(){
    
}

DBClient.prototype.scheduleNmapTask = function(){

}

DBClient.prototype.getScheduledNmapTask = function(){
    return Promise.reject(500);
    
}

module.exports = DBClient;
/*
var fake = require('./raw.js');
module.exports = Object.keys(fake).reduce(function(obj, fun){
    obj[fun] = function(){

    }
    return obj
}, {})
*/