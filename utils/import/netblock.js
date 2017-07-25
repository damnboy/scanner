var ip = require('ip');
var util = require('util');
var events = require('events');
var _ = require('lodash');
//from network block
function NetworkBlock() {//新建一个类
    events.EventEmitter.call(this);
}

util.inherits(NetworkBlock, events.EventEmitter);//使这个类继承EventEmitter

NetworkBlock.prototype.parse = function(network_block){
    var _self = this;
    var subnet = ip.cidrSubnet(network_block)
    var networkRange = _.range(ip.toLong(subnet.firstAddress), ip.toLong(subnet.lastAddress) + 1);
    networkRange.forEach(function(host){
        _self.emit('job', {
            'description' : ip.fromLong(host),
            'hosts' : [ip.fromLong(host)]
        }) 
    })
}

module.exports = new NetworkBlock();
