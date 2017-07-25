var util = require('util');
var events = require('events');
var fs = require('fs');
var _ = require('lodash');

//from txt file
function TxtFile(){
    events.EventEmitter.call(this);
}

util.inherits(TxtFile, events.EventEmitter);//使这个类继承EventEmitter

TxtFile.prototype.parse = function(filename){
    var _self = this;
    fs.readFile(filename, function(err, data){
        data.toString().split('\n').map(function(host){
            if(host.length !== 0){
                _self.emit('job', {
                    'description' : host,
                    'hosts' : [host.replace(/\s+/g, '')]
                })
            }
            
        })
    })
}

module.exports = new TxtFile();




