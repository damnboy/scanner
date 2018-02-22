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
var settings = require('../../settings');
//https://technet.microsoft.com/en-us/library/dd197470%28v=ws.10%29.aspx

function randomItem(array){
    return array[Math.round(Math.random()*10) % array.length];
}
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
        timeout : settings.timeout.dns
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
  return dns_request(domain, 'NS', nameserver, port);
}
function dns_request_a(domain, nameserver, port){
  return dns_request(domain, 'A', nameserver, port);
}

/*
var tld = [
    {'name':'a.root-servers.net', 'ip' : ['198.41.0.4'] },  
    {'name':'b.root-servers.net', 'ip' : ['192.228.79.201']},
    {'name':'c.root-servers.net', 'ip' : ['192.33.4.12']},
    {'name':'d.root-servers.net', 'ip' : ['199.7.91.13']},
    {'name':'e.root-servers.net', 'ip' : ['192.203.230.10']},
    {'name':'f.root-servers.net', 'ip' : ['192.5.5.241']},
    {'name':'g.root-servers.net', 'ip' : ['192.112.36.4']},
    {'name':'h.root-servers.net', 'ip' : ['198.7.190.53']},
    {'name':'i.root-servers.net', 'ip' : ['192.36.148.17']},
    {'name':'j.root-servers.net', 'ip' : ['192.58.128.30']},
    {'name':'k.root-servers.net', 'ip' : ['193.0.14.129']},
    {'name':'l.root-servers.net', 'ip' : ['199.7.83.42']},
    {'name':'m.root-servers.net', 'ip' : ['202.12.27.33']}
]
*/
var tld = [
'198.41.0.4',       
'192.228.79.201',
'192.33.4.12',
'199.7.91.13',
'192.203.230.10',
'192.5.5.241',
'192.112.36.4',
'198.7.190.53',
'192.36.148.17',
'192.58.128.30',
'193.0.14.129',
'199.7.83.42',
'202.12.27.33'
]
/*
    问题汇总

    1.某些ns，即便子域名不存在，也不会返回NXDOMAIN（rcode === 3）
    2.泛解析有时不返回aa标志, 只能根据是否返回 answer为判断
*/
var getAuthorityAnswers = function(target, nameserver){
    function *recursive(){

        var response;
        do{
            response = yield dns_request_a(target, nameserver, 53);

            if(response._flags.rcode !== RESPONSE_CODE['NOERROR'] || response._flags.aa === 0x01)
            {
                return response;
            }

            if(response.additionals.length === 0 && response.authorities.length === 0){
                return response;
            }

            if(response.additionals.length > 0){
                nameserver = randomItem(response.additionals.reduce(function(curr, record){
                    if(record.type === 'A'){
                        curr.push(record.data);
                    }
                    return curr;
                }, []))
            }
            else{
                nameserver = randomItem(response.additionals.reduce(function(curr, record){
                    if(record.type === 'NS'){
                        curr.push(record.data);
                    }
                    return curr;
                }, []))
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

/*
    Zone Transfer
    MX Records
    Authority Nameservers
    Wildcard record
*/

function DNSProber(options){
    events.EventEmitter.call(this);
}

util.inherits(DNSProber, events.EventEmitter);//使这个类继承EventEmitter

DNSProber.prototype.getAuthorityNameServers = function(target){

    var trace = [];
    var self = this;
    function *recursive(){
        var response;
        var nameservers = tld;
        do{
            response = yield dns_request_ns(target, randomItem(nameservers), 53);
            
            if(response._flags.rcode !== RESPONSE_CODE['NOERROR'] || response._flags.aa === 0x01){
                return response;
            }

            if(response.additionals.length > 0){
                nameservers = response.additionals.reduce(function(curr, record){
                    if(record.type === 'A'){
                        curr.push(record.data);
                    }
                    return curr;
                }, []);

                trace[trace.length] = response.additionals.reduce(function(curr, record){
                    if(record.type === 'A'){
                        logger.info({name:record.name, ip:record.data});
                        curr.push({name:record.name, ip:record.data})
                    }
                    return curr;
                },[]);

            }
            else{
                nameservers = response.authorities.reduce(function(curr, record){
                    if(record.type === 'NS'){
                        curr.push(record.data);
                    }
                    return curr;
                },[]);

                trace[trace.length] = response.authorities.reduce(function(curr, record){
                    if(record.type === 'NS'){
                        logger.info({name:record.name, ip:record.data});
                        curr.push({name:record.name, ip:record.data})
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
                    self.emit('error', new Error(err.message + ' while request authority records about target domain: ' + target));
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
                        return getAuthorityAnswers(ns, randomItem(tld)).catch(function(err){
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
                            },[]);

                            return {
                                'name': response.questions[0].name,
                                'ip': addresses
                            }
                        });

                        logger.info('---------------------------------')
                        logger.info('----- Authority Nameservers -----')
                        nameservers.forEach(function(ns){
                            logger.info(ns.name, ns.ip.join(', '))
                        })
                        logger.info('----- Authority Nameservers -----')
                        logger.info('---------------------------------')

                        if(invalid_nameservers.length > 0){
                            logger.warn('There nameserver of target seem down...');
                            invalid_nameservers.forEach(function(ns){
                                logger.warn(ns);
                            })
                        }   

                        self.emit('trace', trace);

                        resolve(nameservers.reduce(function(curr, ns){
                            return curr.concat(ns.ip);
                        },[]))
                    })
                    .catch(function(err){
                        reject(err)
                    });
                }
                else{
                    logger.warn('dns probe failed, try last dns trace stack records as authority nameservers');
                    reject(err);
                }
            }
        }
        step();
    })
}


DNSProber.prototype.wildcard = function(target, nameservers){
    logger.info('Detecting wildcard record on target domain...');
    return bluebird.map(['7e420e12','a35517d','334948b'], function(prefix){
        return getAuthorityAnswers(util.format('%s.%s', prefix, target), randomItem(nameservers))
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
        return {
            nameservers: nameservers,
            wildcards : wildcard_addresses
        }
    })
    .catch(function(err){
        logger.error('error while Detecting wildcard record on target domain...');
    })
}

function DNSBurster() {//新建一个类
    events.EventEmitter.call(this);
}

util.inherits(DNSBurster, events.EventEmitter);//使这个类继承EventEmitter

DNSBurster.prototype.burstTargetDomain = function(target, dict, nameservers){
    var self = this;
    var prober = new DNSProber();
    
    prober.on('trace', function(trace){
        self.emit('trace');
    })

    var step = Promise.resolve(nameservers);
    if(!nameservers || nameservers.length === 0){
        step = step
        .then(function(){
            return prober.getAuthorityNameServers(target);
        });
    }

    return step
    .then(function(nameservers){
        self.emit('nameservers', nameservers);
        return prober.wildcard(target, nameservers);
    })
    .then(function(options){
        self.emit('wildcards', options.wildcards);
        //register listener
        self.burstDomains(dict.map(function(prefix){
            return [prefix, target].join('.');
        }), options.nameservers, options.wildcards);
    })
    .catch(function(err){
        logger.error(err);
    });
    
};

DNSBurster.prototype.burstDomains = function(domains, nameservers, wildcards){

    var self = this;
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
        'UNKNOWN':0,
        'TIMEOUT':0,
    };

    //inner logger
    self.on('SERVFAIL', function(job, response){
        logger.warn('SERVFAIL:');
        logger.warn(job);
        logger.warn(response);
    });

    self.on('NXDOMAIN', function(job, response){
        logger.warn('NXDOMAIN: ' + job.subdomain);
    });

    self.on('NOERROR', function(job, response){
        
        var rep = response.answers.
        filter(function(record){
            return wildcards.indexOf(record.data) < 0;
        })
        .reduce(function(ret, record){
            if(record.type === 'CNAME'){
                ret.cname.push(record.data);
                logger.info('%s(%s) %s', job.subdomain, 'CNAME', record.data);
            }
            if(record.type ==='A'){
                ret.a.push(record.data);
                logger.info('%s(%s) %s', job.subdomain, 'A', record.data);
            }
            return ret;
        },{
            'domain' : job.subdomain,
            'cname' : [],
            'a' : [],
            "resolver" : job.nameserver
        });

        if(rep.a.length !== 0 || rep.cname.length !== 0){
            self.emit('response', rep);
        }
    });

    var work = async.queue(function(job, done){
      getAuthorityAnswers(job.subdomain, job.nameserver)
      .then(function(response){
          var response_code = Object.keys(RESPONSE_CODE)[response._flags.rcode];
          responses_summary[response_code] += 1;
          self.emit(response_code, job, response);
          done();
      })
      .catch(function(err){
          if(err.message === 'Query timed out'){
            responses_summary.TIMEOUT += 1;
            logger.error('Timeout while resolving ' + job.subdomain  + ' @ ' + job.nameserver);
            self.emit('timeout', job);
          }else{
            responses_summary.UNKNOWN += 1;
            self.emit('error', job, err);
          }
          done();
      });

    }, nameservers.length);

    work.drain = function() {
      setTimeout(function(){
          var nexts = domains.splice(0, nameservers.length) ;

          nexts.map(function(domain, index){
              work.push({
                  subdomain: domain,
                  nameserver: nameservers[index]
                });
          });
      }, 0);

      if(domains.length === 0){
          Object.keys(responses_summary).forEach(function(key){
              logger.info('%s : %s' ,key, responses_summary[key]);
          });

          self.emit('finish', responses_summary);
      }
      
    };

    work.drain();
};

module.exports = DNSBurster;