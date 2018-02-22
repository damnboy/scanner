var util = require('util');
var EventEmitter = require('events').EventEmitter;

function SSLScanTask(options) {//新建一个类
    events.EventEmitter.call(this);
}

util.inherits(SSLScanTask, events.EventEmitter);//使这个类继承EventEmitter


SSLScanTask.prototype.schedule = function(){
    
}