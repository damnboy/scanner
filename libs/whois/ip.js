var EventEmitter = require('events').EventEmitter;
var util = require('util');
var whois = require('whois');
var parse = require('./parse')
var log = require('../../utils/logger.js');
var logger = log.createLogger('whois-ip');
var Queue = require('../../utils/queue.js');
var _ = require('lodash')

function IPWhois(){
    
    EventEmitter.call(this);

    var self = this;

    this.queue = new Queue(8);
    this.queue.on('done', function(response){
        var p = parse[response.server];
        if(p){
            response['detail'] = p(response.data);
            self.emit('done', response)
        }
    })

    this.queue.on('error', function(error){
        self.emit('error', error)
    })
}

util.inherits(IPWhois, EventEmitter);//使这个类继承EventEmitter


IPWhois.prototype._whois = function(ip, whois_server){
    var self = this;
    return new Promise(function(resolve, reject){
        whois.lookup(whois_server === 'whois.arin.net' ? 'z + ' + ip : ip, 
            {"server" : whois_server, "follow" : 0}, function(err, data){
            if(err){
                reject(err);
            }

            var match = data.match(/ReferralServer:\s*whois:\/\/([\w\.]*)/i)
            if(match === null){
                return resolve({
                    "ip" : ip ,
                    "server" : whois_server, 
                    "data" : data
                });
            }

            if(match.length > 0){
                var acc_whois_server = match[1];
                //logger.info('%s not belongs to arin, redirecting whois request to %s', ip, acc_whois_server);
                return resolve(self._whois(ip, acc_whois_server))
            }
        })
    })
}

IPWhois.prototype.whois = function(ip){
    var self = this;
    this.queue.enqueue(function(){
        return self._whois(ip, 'whois.arin.net')}
    );
}

module.exports = IPWhois;