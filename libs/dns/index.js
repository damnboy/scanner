var fs = require('fs')
var util = require('util');
var events = require('events');
var co = require('co');
var async = require('async');
var dns = require('dns-socket')
var bluebird = require('bluebird');
var _ = require('lodash');
var ip = require('ip');
var log = require('../../utils/logger.js');
var logger = log.createLogger('[DNS]');
//https://technet.microsoft.com/en-us/library/dd197470%28v=ws.10%29.aspx

var RESPONSE_CODE = {
    'NOERROR'   : 0x0,
    'FORMERR'   : 0x1,
    'SERVFAIL'  : 0x2,
    'NXDOMAIN'  : 0x3,
    'NOTIMP'    : 0x4,
    'REFUSED'   : 0x5,
    'YXDOMAIN'  : 0x6,
    'YXPREST'   : 0x7,
    'NXRREST'   : 0x8,
    'NOTAUTH'   : 0x9,
    'NOTZONE'   : 0xA
};

/*
  获取ns记录时遇到的问题：
  1.目标不存在ns记录 (解决办法：跟踪www记录的解析过程，提取出ns服务器)
  2.ns记录与目标域名的记录不不属于同一个顶级域，没有additions（接续办法：直接取authority中的主机名）
*/
function dns_request(domain, type, nameserver, port){
  
  return new Promise(function(resolve, reject){
    var socket = dns({
        retries : 3,
        timeout : 5000
    })
    socket.query({
      questions: [{
        type: type,
        flag: socket.RECURSION_DESIRED,
        name: domain
      }]
    }, port, nameserver, function (err, response) {
      socket.destroy()
      if(err){
        reject(err)
      }
      else{
        //https://tools.ietf.org/html/rfc1035 
        //4.1.1. Header section format
        response._flags = {
          'rcode':  response.flags & 0x000f,            //标示本次dns响应的状态，0标示无错误，非0标示存在错误
          'z':  (response.flags >> 4) & 0x8,
          'ra':  (response.flags >> 7) & 0x1,       //Recursion Available
          'rd':  (response.flags >> 8) & 0x1,       //Recursion Desired	
          'tc':  (response.flags >> 9) & 0x1,       //Truncated Response	
          'aa':  (response.flags >> 10) & 0x1,      //Authoritative Answer，该响应来自权威服务器
          'opcode':  (response.flags >> 11) & 0xf,  //Standards Action
          'qr':  (response.flags >> 15) & 0x1,      //0表示查询，1表示响应
        }
        resolve(response);
      }
    })
  })
}

function dns_request_ns(domain, nameserver, port){
  logger.info('digging %s on %s', domain, nameserver);
  return dns_request(domain, 'NS', nameserver, port)
}
function dns_request_a(domain, nameserver, port){
  return dns_request(domain, 'A', nameserver, port)
}


var tld = [
    {'name':'a.root-servers.net', 'ip' : ['198.41.0.4'] }/*,  
    {'name':'b.root-servers.net', 'ip' : '192.228.79.201'},
    {'name':'c.root-servers.net', 'ip' : '192.33.4.12'},
    {'name':'d.root-servers.net', 'ip' : '199.7.91.13'},
    {'name':'e.root-servers.net', 'ip' : '192.203.230.10'},
    {'name':'f.root-servers.net', 'ip' : '192.5.5.241'},
    {'name':'g.root-servers.net', 'ip' : '192.112.36.4'},
    {'name':'h.root-servers.net', 'ip' : '198.7.190.53'},
    {'name':'i.root-servers.net', 'ip' : '192.36.148.17'},
    {'name':'j.root-servers.net', 'ip' : '192.58.128.30'},
    {'name':'k.root-servers.net', 'ip' : '193.0.14.129'},
    {'name':'l.root-servers.net', 'ip' : '199.7.83.42'},
    {'name':'m.root-servers.net', 'ip' : '202.12.27.33'}*/
]
/*
    问题汇总

    1.某些ns，即便子域名不存在，也不会返回NXDOMAIN（rcode === 3）
    2.泛解析有时不返回aa标志, 只能根据是否返回 answer为判断
*/
var getAuthorityAnswers = function(target, custom_nameservers){
    function *recursive(){
        var response;
        var nameservers = custom_nameservers === undefined ? tld : custom_nameservers;
        do{
            var random_ns = nameservers[Math.round(Math.random()*10) % nameservers.length];
            var random_ns_ip = random_ns.ip[Math.round(Math.random()*10) % random_ns.ip.length];
            response = yield dns_request_a(target, random_ns_ip, 53);
            
            if(response._flags.rcode !== RESPONSE_CODE['NOERROR'] || response._flags.aa === 0x01)
            {
                return response;
            }

            if(response.additionals.length === 0 && response.authorities.length === 0){
                return response;
            }

            if(response.additionals.length > 0){
                nameservers = response.additionals.reduce(function(curr, record){
                    if(record.type === 'A'){
                    curr.push({'name':record.name, 'ip' : [record.data]})
                    }
                    return curr;
                }, []);
            }
            else{
                nameservers = response.authorities.reduce(function(curr, record){
                if(record.type === 'NS'){
                    curr.push({'name':record.data, 'ip' : [record.data]})
                }
                return curr;
                },[]);
            }
        }
        while(true);
    }

    return new Promise(function(resolve, reject){
        var r = recursive();
        function step(nameservers){
            var p = r.next(nameservers);
            if(!p.done){
                p.value
                .then(function(response){
                    step(response)
                })
                .catch(function(err){
                    reject(err);
                })
            }
            else{
                resolve(p.value);
            }
        }
        step();
    })
}

function DNSBatch(options) {//新建一个类
    events.EventEmitter.call(this);
    this.options = options;
    this.options.nameservers = this.options.nameservers.map(function(ns){
        return {"ip": [ns]};
    })
}

util.inherits(DNSBatch, events.EventEmitter);//使这个类继承EventEmitter

DNSBatch.prototype.batch = function(domains){

}

function DNSProber(options){
    events.EventEmitter.call(this);
    this.options = options;
}

util.inherits(DNSProber, events.EventEmitter);//使这个类继承EventEmitter

DNSProber.prototype._probe = function(target, nameservers){

}

DNSProber.prototype.manualProbe = function(target, nameservers, dict){
    var _self = this;
    function startBuster(){
        if(nameservers.length > 0){
            _self.emit('info', {
                //nameservers
                "message" : nameservers.reduce(function(message, ns){
                    message += util.format('%s\r\n', ns);
                    return message;
                }, util.format('DNS probe ok, got %d nameserver from target domain\r\n', nameservers.length))
            })  
            _self.emit('info', {
                "message": util.format('Start buster target domain: %s', target)
            })  
            var burster = new DNSBurster({
                'target' : target,
                'nameservers' : nameservers
            }); 
            burster.wildcard()
            .then(function(wildcard_addresses){
                var cname = [];
                var private = [];
                var public = [];    
                burster.on('SERVFAIL', function(job, response){
                    logger.warn('SERVFAIL:')
                    console.log(job)
                    console.log(response)
                })
                burster.on('NOERROR', function(job, response){
                
                    var valid_records = response.answers.filter(function(record){
                        if(ip.isPrivate(record.data)){
                            private.push({
                                "domain" : job.subdomain,
                                "data":record.data
                            });
                        }
                        return wildcard_addresses.indexOf(record.data) < 0 && ip.isPublic(record.data);
                    }); 
                    if(valid_records.length > 0){
                        var resp = valid_records.reduce(function(ret, record){
                            if(record.type === 'CNAME'){
                                ret.cname.push(record.data)
                            }
                            if(record.type ==='A'){
                                ret.a.push(record.data)
                            }
                            return ret
                        },{
                            'domain' : job.subdomain,
                            'cname' : [],
                            'a' : [],
                            "resolver" : job.ns.ip[0]
                        });

                        _self.emit('response', resp);

                        valid_records.forEach(function(record){
                            var r = {
                                "domain" : job.subdomain,
                                "data" : record.data
                            };
                            if(record.type === 'CNAME'){
                                cname.push(r);
                                _self.emit('record.cname', r);
                            }
                            if(record.type ==='A'){
                                public.push(r);
                                _self.emit('record.a', r);
                            }
                            logger.info(r);
                            //_self.emit("response", r);
                        });
                    }
                }); 

                burster.on('error', function(job, err){
                    if(err.message === 'Query timed out'){
                        _self.emit('timeout', job)
                    }else{
                        _self.emit('error', err);
                    }
                    
                });

                burster.on('finish', function(response){
                    _self.emit('finish', response, public, cname, private, wildcard_addresses);
                }); 
                
                burster.burst(dict);
            });
        }
        else{
            logger.error('no ns records');
            _self.emit('error', new Error('no ns records'));
        }
    }
    startBuster();
}

DNSProber.prototype.autoProbe = function(target, dict){
    var trace=[];
    var _self = this;
    function *recursive(){
        var response;
        var nameservers = tld;
        do{
            var random_ns = nameservers[Math.round(Math.random()*10) % nameservers.length];
            var random_ns_ip = random_ns.ip[Math.round(Math.random()*10) % random_ns.ip.length];
            
            response = yield dns_request_ns(target, random_ns_ip, 53);
            
            if(response._flags.rcode !== RESPONSE_CODE['NOERROR'] || response._flags.aa === 0x01){
                return response;
            }

            if(response.additionals.length > 0){
                nameservers = response.additionals.reduce(function(curr, record){
                    if(record.type === 'A'){
                        curr.push({'name':record.name, 'ip':[record.data]})
                    }
                    return curr;
                }, []);
            }
            else{
                nameservers = response.authorities.reduce(function(curr, record){
                    if(record.type === 'NS'){
                        curr.push({'name':record.data, 'ip': [record.data]})
                    }
                    return curr;
                },[]);
            }

            logger.info('------')
            nameservers.forEach(function(ns){
                logger.info(ns);
            })
            logger.info('------')

            trace.push(nameservers);
        }
        while(true);
    }

    //return new Promise(function(resolve, reject){
        var r = recursive();
        function step(nameservers){
            var p = r.next(nameservers);
            if(!p.done){
                p.value
                .then(function(response){
                    step(response)
                })
                .catch(function(err){
                    _self.emit('error', new Error(err.message + ' while request authority records about target domain: ' + target));
                })
            }
            else{
                var nameservers = p.value.answers.reduce(function(arr, ns){
                    if(ns.type === 'NS'){
                        arr.push(ns.data);
                    }
                    return arr;
                },[])

                if(nameservers.length > 0){
                    var invalid_nameservers = [];
                    bluebird.filter(nameservers.map(function(ns){
                        var ip = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
                        if(ip.test(ns)){
                            return ns;
                        }
                        return getAuthorityAnswers(ns, tld).catch(function(err){
                            invalid_nameservers.push(ns);
                            return undefined
                        })
                    }), function(answers){
                        return answers !== undefined;
                    })
                    .then(function(responses){
                        var nameservers =  responses.map(function(response){
                            var addresses = response.answers.reduce(function(r, answer){
                                if(answer.type === 'A'){
                                    if(ip.isPrivate(answer.data)){
                                        logger.warn('detect private address %s on authority nameservers %s', answer.data, response.questions[0].name);
                                    }
                                    if(ip.isPublic(answer.data)){
                                        r.push(answer.data)
                                    }
                                }
                                return r;
                            },[])
                            return {
                                'name': response.questions[0].name,
                                'ip': addresses
                            }
                        });


                        logger.info('------')
                        nameservers.forEach(function(ns){
                            logger.info(ns);
                        })
                        logger.info('------')

                        if(invalid_nameservers.length > 0){
                            _self.emit('info', {
                                //nameservers
                                "message" : invalid_nameservers.reduce(function(message, ns){
                                    message += util.format('%s\r\n', ns);
                                    return message;
                                }, util.format('There nameserver of target seem down...\r\n'))
                            })
                        }   
                        trace.push(nameservers);

                        _self.emit('trace', trace);

                        var ns = nameservers.reduce(function(curr, ns){
                            return curr.concat(ns.ip);
                        },[]);

                        _self.manualProbe(target, ns, dict);
                    })
                    .catch(function(err){
                        _self.emit('error', err);
                    });
                }
                else{
                    logger.warn('dns probe failed, try last dns trace stack records as authority nameservers');
                    _self.emit('failed', trace);
                }
            }
        }
        step();
    //})  
};

function DNSBurster(options) {//新建一个类
    events.EventEmitter.call(this);
    this.options = options;
    this.options.nameservers = this.options.nameservers.map(function(ns){
        return {"ip": [ns]};
    })
}

util.inherits(DNSBurster, events.EventEmitter);//使这个类继承EventEmitter

DNSBurster.prototype.wildcard = function(){
    var nameservers = this.options.nameservers;
    var target = this.options.target;
    logger.info('Detecting wildcard record on target domain...');
    return bluebird.map(['7e420e12','a35517d','334948b'], function(ns){
        return getAuthorityAnswers(util.format('%s.%s', ns, target), nameservers)
        .catch(function(err){
            return undefined;
        })
    })
    .then(function(responses){
        var wildcard_addresses = responses.reduce(function(curr, response){
            if(response){
                var addresses = response.answers.reduce(function(r, answer){
                    if(answer.type === 'A'){
                        r.push(answer.data);
                    }
                    return r;
                },[]);
                curr = curr.concat(addresses);
            }
            return curr;
        }, []);

        wildcard_addresses =  _.uniq(wildcard_addresses);
        if(wildcard_addresses.length > 0){
            logger.warn('wildcard addresses detected...', wildcard_addresses);
        }

        else{
            logger.info('wildcard addresses not found...');
        }
        return wildcard_addresses;
    });
}

DNSBurster.prototype.burstDomains = function(domains){

    var _self = this;
    var target = this.options.target;
    var nameservers = this.options.nameservers;
    var responses_summary = {
        'NOERROR':0,
        'FORMERR':0,
        'SERVFAIL':0,
        'NXDOMAIN':0,
        'NOTIMP':0,
        'REFUSED':0,
        'YXDOMAIN':0,
        'YXPREST':0,
        'NXRREST':0,
        'NOTAUTH':0,
        'NOTZONE':0,
        'UNKNOWN':0
    };

    //return new Promise(function(resolve, reject){
      var work = async.queue(function(job, done){
        getAuthorityAnswers(job.subdomain, [job.ns])
        .then(function(response){
            var response_code = Object.keys(RESPONSE_CODE)[response._flags.rcode];
            responses_summary[response_code] += 1;

            _self.emit(response_code, job, response);

            done();
        })
        .catch(function(err){
            responses_summary['UNKNOWN'] += 1;
            _self.emit('error', job, err);

            done();
        });

      }, 16);

      work.drain = function() {
        Object.keys(responses_summary).forEach(function(key){
            logger.info('%s : %s' ,key, responses_summary[key]);
        })

        _self.emit('finish', responses_summary);
      };

      domains.forEach(function(domain){
          work.push({
            subdomain: domain,
            ns: nameservers[Math.round(Math.random()*10) % nameservers.length]
          });
        });
    //});
}

DNSBurster.prototype.burst = function(dict){
    var target = this.options.target;
    return this.burstDomains(dict.map(function(subdomain){
        return [subdomain, target].join('.')
    }))
}

module.exports = {
    "DNSProber" :  DNSProber,
    "DNSBurster" : DNSBurster
}