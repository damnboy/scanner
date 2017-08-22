var EventEmitter = require('events').EventEmitter;
var util = require('util');
var whois = require('whois');
var parse = require('./parse')
var log = require('../../utils/logger.js');
var logger = log.createLogger('whois-ip');

function IPWhois(){
    EventEmitter.call(this);
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
                resolve({"server": whois_server, "data":data});
                return;
            }

            if(match.length > 0){
                var acc_whois_server = match[1];
                //logger.info('%s not belongs to arin, redirecting whois request to %s', ip, acc_whois_server);
                resolve(self._whois(ip, acc_whois_server))
            }
        })
    })
}

IPWhois.prototype.whois = function(ip){
    var self = this;
    //logger.info('sending whois request about %s to whois.arin.net...', ip)
    this._whois(ip, 'whois.arin.net')
    .then(function(data){
        //logger.info("Response from %s", data.server)
        var p = parse[data.server];
        if(p){
            self.emit('result', p(data.data));
        }
            
    })
    .catch(function(err){
        console.log(ip)
        console.log(err)
    })
}

module.exports = IPWhois;