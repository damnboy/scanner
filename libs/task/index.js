var events = require('events');
var util = require('util');
var co = require('co')
var dns = require('../dns');
var IPWhois = require('../whois');
var dict = require('../../utils/dict');
var log = require('../../utils/logger.js');
var _ = require('lodash');
var uuid = require('uuid/v1');

var logger = log.createLogger('[SCAN-TASK]');

function ScanTask(){
    events.EventEmitter.call(this);
}

util.inherits(ScanTask, events.EventEmitter);//使这个类继承EventEmitter

ScanTask.prototype.start = function(target, options){

    var self = this;
    self.target = target;
    self.options = options;
    self.id = uuid();

    logger.info('Scan task(%s) on %s started...', self.id, self.target);

    return co(function *(){
        var dns_results = yield self.probeDNS(self.target);
        logger.info('probeDNS done~');

        var ip_addresses = dns_results['records']['a'].map(function(i){
            return i.data;
        })

        var whois_results = yield self.probeWhois(_.uniq(ip_addresses));
        logger.info('probeWhois done~');
    })
}

ScanTask.prototype.probeWhois = function(ip_addresses){

    var self = this;
    var result = {
        'records' : []
    };

    return new Promise(function(resolve, reject){
        var whois = new IPWhois();
    
        whois.on('finish', function(){
            resolve(result);
        })

        whois.on('record', function(data){
            self.emit('whois.ip.record', data);
            result['records'].push(data)
        })

        whois.on('error', function(err){
            self.emit('whois.ip.error', data);
            reject(err)
        })
    
        ip_addresses.forEach(function(ip){
            whois.whois(ip);
        })
    })
}

ScanTask.prototype.probeDNS = function(target){
    var self = this;
    var result = {
        'records' : {
            'a' : [],
            'cname' : []
        },
        'summary' : {}
    }

    return new Promise(function(resolve, reject){
        var dns_prober = new dns.DNSProber();

        dns_prober.on('trace', function(trace){
            self.emit('dns.trace', trace);
        })
        
        dns_prober.on('error', function(error){
            self.emit('dns.error', error);
            //reject(error);
        })

        dns_prober.on('record.a', function(record){
            self.emit('dns.record_a', record);
            result['records']['a'].push(record);
        })

        dns_prober.on('record.cname', function(record){
            self.emit('dns.record_cname', record);
            result['records']['cname'].push(record);
        })
        
        dns_prober.on('finish', function(summary){
            self.emit('dns.finish', summary);
            result['summary'] = summary;
            resolve(result);
        })

        //logger.info();
        dict.getTxtDict(__dirname + '/../dns/dicts/' + self.options.dict)
        .then(function(dict){

            dns_prober.on('failed', function(trace){
              
                var nameservers = trace[trace.length - 1].reduce(function(ret, record){
                    return ret.concat(record.ip)
                }, [])

                dns_prober.manualProbe(target, nameservers, dict)
            })

            dns_prober.autoProbe(target, dict);
        })
        .catch(function(err){
            logger.error('Loading dict failed: ', err.message);
        })
        
    })
    .catch(function(err){
        logger.info('probeDNS error~');
        logger.error(err);
    });
}

module.exports = ScanTask;