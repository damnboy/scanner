function Fake (){

}

Fake.prototype.saveDNSRecord = function(){

}

Fake.prototype.queryDNSRecord = function(){
    
}

Fake.prototype.analyzeDNSRecord = function(){
    
}

module.exports = Fake;
/*
var fake = require('./raw.js');
module.exports = Object.keys(fake).reduce(function(obj, fun){
    obj[fun] = function(){

    }
    return obj
}, {})
*/