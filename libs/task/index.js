var events = require('events');
var util = require('util');
var co = require('co')
var dns = require('../dns');
var IPWhois = require('../whois');
var dict = require('../../utils/dict');
var log = require('../../utils/logger.js');
var _ = require('lodash');

var logger = log.createLogger('[SCAN-TASK]');

function ScanTask(){
    events.EventEmitter.call(this);
}

util.inherits(ScanTask, events.EventEmitter);//使这个类继承EventEmitter

ScanTask.prototype._co = function(target){
    var self = this;
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

ScanTask.prototype.start = function(target){

    this.target = target;
    this.id = '{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}';

    logger.info('Scan task(%s) on %s started...', this.id, this.target)

    return this._co(target);
    
}

ScanTask.prototype.probeWhois = function(ip_addresses){

    var result = {
        'records' : []
    };

    return new Promise(function(resolve, reject){
        var whois = new IPWhois();
    
        whois.on('finish', function(){
            resolve(result);
        })

        whois.on('record', function(data){
           result['records'].push(data)
        })

        whois.on('error', function(err){
            reject(err)
        })
    
        ip_addresses.forEach(function(ip){
            whois.whois(ip);
        })
    })
}
ScanTask.prototype.probeDNS = function(target){
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
        
        })
        
        dns_prober.on('error', function(error){
            reject(error);
        })

        dns_prober.on('record.a', function(record){
            result['records']['a'].push(record);
        })

        dns_prober.on('record.cname', function(record){
            result['records']['cname'].push(record);
        })
        
        dns_prober.on('finish', function(summary){
            result['summary'] = summary;

            resolve(result);
        })

        dict.getTxtDict('/home/ponytail/Desktop/Project/scanner/libs/dns/dicts/dns-test')
        .then(function(dict){

            dns_prober.on('failed', function(trace){
              
                var nameservers = trace[trace.length - 1].reduce(function(ret, record){
                    return ret.concat(record.ip)
                }, [])

                dns_prober.manualProbe(target, nameservers, dict)
            })

            dns_prober.autoProbe(target, dict);
        });

    })
}

module.exports = ScanTask;