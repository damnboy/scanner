var EventEmitter = require('events').EventEmitter;
var util = require('util');
var whois = require('whois');
var parse = require('./parse')
var log = require('../../utils/logger.js');
var logger = log.createLogger('[WHOIS-IP]');
var Queue = require('../../utils/queue.js');
var _ = require('lodash')


function IPWhois(){
    
    this.summary = {}
/*
    EventEmitter.call(this);

    var self = this;
    this.summary = {}

    this.queue = new Queue(8);
    this.queue.on('done', function(response){
        var p = parse[response.server];
        if(p){
            var record = {
                'ip' : response.ip,
                'server' : response.server,
                'detail' : []
            };
            var detail = p(response.data);
            logger.info('%s [%s]', response.ip, response.server);
            record.detail = detail;
            detail.forEach(function(i){
                logger.info('%s  %s', i.netname, i.netblock);
                
                    if(self.summary[i.netname] === undefined){
                        self.summary[i.netname] = []
                    }
                    
                    record.detail.push({
                        'netname' : i.netname,
                        'netblock' : i.netblock
                    });
                    self.summary[i.netname].push(i.netblock)
                
            })

            self.emit('record', record);
        }
    })

    this.queue.on('error', function(error){
        logger.error(error.ip, error)
    })

    this.queue.on('finish', function(){
        
        Object.keys(self.summary).forEach(function(k){
            self.summary[k] = _.uniq(self.summary[k])
        })
        
        self.emit('finish' , self.summary)
    })
    */
}

util.inherits(IPWhois, EventEmitter);//使这个类继承EventEmitter


IPWhois.prototype._whois = function(ip, whois_server){
    var self = this;
    return new Promise(function(resolve, reject){
        whois.lookup(whois_server === 'whois.arin.net' ? 'z + ' + ip : ip, 
            {"server" : whois_server, "follow" : 0}, function(err, data){
            if(err){
                err.ip = ip;
                return reject(err);
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
                return resolve(self._whois(ip, acc_whois_server));
            }
        })
    })
}
/*
IPWhois.prototype.enqueue_whois = function(ip){
    var self = this;
    this.queue.enqueue(function(){
        return self._whois(ip, 'whois.arin.net')}
    );
}
*/
IPWhois.prototype.whois = function(ip){

    return this._whois(ip, 'whois.arin.net')
    .then(function(response){
        var p = parse[response.server];
        if(p){
            var record = {
                'ip' : response.ip,
                'server' : response.server,
                'detail' : []
            };
            var detail = p(response.data);
            logger.info('%s [%s]', response.ip, response.server);
            record.detail = detail.map(function(i){
                logger.info('netname: ', i.netname)
                logger.info('netblock: ' , i.netblock);
                return i;
            })
            return record;
        }
    })

    
}

module.exports = IPWhois;