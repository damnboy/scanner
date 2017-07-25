/*

dns-packet中的几个标志位
http://www.simpledns.com/help/v50/index.html?df_recursion.htm


DNS requests can either be "recursive" or "non-recursive".

 

Client applications (such as Internet browsers) typically requests that the DNS server 
performs recursion for them by setting an RD (Recursion Desired) flag in the request packet. This is a recursive request.

Client applications do this both because they do not posses the ability to resolve domain names themselves, 
and also to take advantage of centralized caching on the DNS server.

 

However, when a DNS server sends requests to other DNS servers as part of the recursion process,
 these requests are typically non-recursive (the RD flag is not set).
The DNS server indicates back to the client if it is willing to perform recursion by setting or not setting an RA (Recursion Available) flag in the DNS response packet.
When a DNS server receives a recursive request from a client that it is willing to perform recursion for, it will go through the process of resolving the requested domain name by first asking the root servers, which respond with a referral to the top level DNS servers, then asking one of those servers, which respond with a referral to the next level DNS servers, etc.
When a DNS server receives a non-recursive request or a request from a client that it is not willing to perform recursion for, it typically responds immediately with whatever local data it has available at the time without doing any additional processing.

  packet.RECURSION_DESIRED（请求）
  packet.RECURSION_AVAILABLE（响应）


  packet.TRUNCATED_RESPONSE（请求）
  packet.AUTHORITATIVE_ANSWER（响应）
  
  Security aware DNS server
  packet.AUTHENTIC_DATA
  packet.CHECKING_DISABLED

https://www.cloudxns.net/Support/detail/id/2445.html
https://imlonghao.com/40.html
http://www.zytrax.com/books/dns/ch15/

*/
var dns = require('dns-socket')
var util = require('util')
var async = require('async')
var fs = require('fs')


function dns_request(domain, type, nameserver, port){
  return new Promise(function(resolve, reject){
    var socket = dns({retries:3,timeout:5000})
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
        response._flags = {
          'rcode':  response.flags & 0x000f,
          'z':  (response.flags >> 4) & 0x8,
          'ra':  (response.flags >> 7) & 0x1,
          'rd':  (response.flags >> 8) & 0x1,
          'tc':  (response.flags >> 9) & 0x1,
          'aa':  (response.flags >> 10) & 0x1,
          'opcode':  (response.flags >> 11) & 0xf,
          'qr':  (response.flags >> 15) & 0x1,
        }
        resolve(response);
      }
    })
  })
}

function dns_request_ns(domain, nameserver, port){
  return dns_request(domain, 'NS', nameserver, port)
}
function dns_request_a(domain, nameserver, port){
  return dns_request(domain, 'A', nameserver, port)
}

/*
function getAuthServers(domain, nameserver, port){
  return dns_request_ns(domain, nameserver, port)
  .then(function(res){
    var auth_servers = []
    //res.answers.push('dns.si.net.cn');
    //res.answers.push('ns1.si.net.cn');
    res.answers.forEach(function(record){
      var ns = record.data
      auth_servers.push(dns_request_a(ns, nameserver, port)
      .then(function(res){
        return res.answers
      }).catch(function(err){
        console.log('auth', err)
      }))
    })
    return auth_servers
  })
  .then(function(auth_servers){
    return Promise.all(auth_servers)
    .then(function(authServers){
      var ip = []
      console.log('Got %d AUTHORITY DNS Servers', authServers.length)
      authServers.forEach(function(nsServer){
        nsServer.forEach(function(record){
          console.log('%s %s', record.name, record.data)
          ip.push(record.data)
        })
      })
      return ip;
    })
  })
}





var getAuthoritiesNameservers = function(target_domain){

  function *recursive(domain){
    var parts = domain.split('.').reverse();
    var level = 1;
    var nameservers = top_level_nameservers
    while(true){
      var d = parts.slice(0, level++).reverse().join('.');
      nameservers = yield dns_request_ns(d, nameservers[0].ip, 53);
      console.log(d, nameservers)
      if(d === domain){
        return nameservers;
      }
    }
  }

  return new Promise(function(resolve, reject){
    var r = recursive(target_domain);
    function step(nameservers){
        var p = r.next(nameservers);
        if(!p.done){
            p.value
            .then(function(response){
              var nameservers = response.additionals.reduce(function(curr, record){
                if(record.type === 'A'){
                  curr.push({'name':record.name, 'ip':record.data});
                } 
                return curr;
              }, [])

              step(nameservers)

            })
            .catch(function(err){
              reject(err)
            })
        }
        else{
          resolve(p.value);
        }
    }
    step();
  })
}


var success = 0;
var failed = 0
var notFound = 0;
var noAnswers = 0;
var new_authorities = {};
var work = async.queue(function(job, done){
  
  //;; ->>HEADER<<- opcode: QUERY, status: REFUSED, id: 50536
  //dig aws.fubon.com @60.248.209.158
  
;  dns_request_a(job.subdomain, job.ns, 53)
  .then(function(res){
    var rcode = res.flag & 15;
    if(rcode !== 0){
      console.log('rrep err!')
    }
    if(res.answers.length === 0){
      if(res.authorities.length === 1 && res.authorities[0].type === 'SOA'){
        notFound = notFound + 1
      }
      else{
        
        //  查找其中是否包含ns记录，如果有，则需要重新提交dns解析请求
        //  step.1 从authorities中取出ns记录
            
        //  step.2 从additionals中查找是否包含ns记录的ip地址，如不包含ip地址，则需要重新提交解析
        
        //TODO returen type UNKNOWN_80
        res.authorities.forEach(function(authority){
          if(new_authorities[authority.data] === undefined){
            new_authorities[authority.data] = []
            console.log('\rnew dns authorities (%s) detected !!! while lookup %s via ', authority.data, job.subdomain, job.ns)
          }
        })
        res.additionals.forEach(function( additional){
          if(-1 === new_authorities[additional.name].indexOf(additional.data)){
            new_authorities[additional.name].push(additional.data)
          }
        })
        var ip = res.authorities.reduce(function(addresses, authority){
          return Array.prototype.concat.apply(addresses, new_authorities[authority.data])
        }, [])
        
        if(ip.length === 0){
          notFound = notFound + 1;
        }
        else{
          work.push({
            subdomain: job.subdomain,
            ns: ip[Math.round(Math.random()*10) % ip.length]
          });
        }
      }
    }
    else{
      success = success + 1;
      res.answers.forEach(function(record){
        console.log('\r',record.name, record.type, record.data);
        //if(record.type === 'A'){
        //  console.log('\r%s %s %s', job.prefix, record.data, record.name)
        //}
      });
    }
    process.stdout.write(util.format('\rprogress:%d/%d/%d', success, failed, notFound));
  
    done();
  })
  .catch(function(err){
    failed = failed + 1;
    console.log('\r', job.subdomain,'timeout');
    //console.log(err)
    done()
  })
}, 32)


work.drain = function() {
  console.log(new_authorities)
  console.log('\rfinished success:%d, failed:%d, not exist:%d', success, failed, notFound);
};
*/

/*
var domain = 'si.net.cn';
var nameserver = '203.119.29.1';
var port = 53;
getAuthServers(domain, nameserver, port)
.then(function(authServers){
  fs.readFile('/Users/cboy/Desktop/Node.js the Right Way/Scanner/dict', function(err, data){
    var string = data.toString('ascii');
    var subdomains = string.split('\n');
    subdomains.forEach(function(subdomain){
      work.push({
        prefix: subdomain,
        ns: '218.66.59.45'//authServers[Math.round(Math.random()*10) % authServers.length]
      });
    });
  });
})
.catch(function(err){
  console.log(err)
})
*/
/*
var target = 'si.net.cn';
getAuthoritiesNameservers(target)
.then(function(result){
    fs.readFile('/Users/cboy/Desktop/Node.js the Right Way/Scanner/dict', function(err, data){
    var string = data.toString('ascii');
    var subdomains = string.split('\n');
    subdomains.forEach(function(subdomain){
      work.push({
        subdomain: [subdomain,target].join('.'),
        ns: result[Math.round(Math.random()*10) % result.length].ip
      });
    });
  });
  //console.log(result)
})
.catch(function(err){
  console.log(err)
})
*/

/*
function getAuthoritiesServers(target){
  return dns_request_ns(target, '198.41.0.4', 53)
  .then(function(response){
    return response.additionals.reduce(function(curr, record){
      if(record.type === 'A'){
        curr.push({'name':record.name, 'ip':record.data});
      } 
        return curr;
    }, [])
  })
  .then(function(tld_servers){
    return dns_request_ns(target, tld_servers[0].ip, 53);
  })
  .then(function(response){
    var authorities = response.authorities.reduce(function(curr, record){
      curr[record.data] = []
      return curr;
    }, {})

    response.additionals.forEach(function(record){
        if(record.type === 'A'){
          authorities[record.name].push(record.data)
        }
    });
    return authorities;
  })  
}

getAuthoritiesServers('sina.cn')
.then(function(authorities){
  console.log(authorities)
})
.catch(function(err){
  console.log(err)
})
*/

var tld = [
        {'name':'a.root-servers.net', 'ip' : '198.41.0.4' }/*,   
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
权威ns的查找包含诸多不确定因素
1.返回的ns服务器中存在挂掉的机器（si.net.cn）
2.

因此打印出完整的权威ns的查找过程。
在爆破过程中手动选择ns服务器列表。
*/

var getAuthoritiesServers = function(target){
  var all_nameservers = [];
  function *recursive(){
    var nameservers = tld;
    var response;
    while(response === undefined || response._flags.aa !== 0x01){
      //var ns = nameservers[Math.round(Math.random()*10) % nameservers.length].ip;
      var ns = nameservers[0].ip;
      response = yield dns_request_ns(target, ns, 53)
      nameservers = response.additionals.reduce(function(curr, record){
        if(record.type === 'A'){
          curr.push({'name':record.name, 'ip':record.data})
        }
        return curr;
      }, [])
      if(nameservers.length === 0){
        nameservers = response.authorities.reduce(function(curr, record){
          if(record.type === 'A'){
            curr.push({'name':record.data, 'ip': record.data})
          }
          return curr;
        },[])
      }
      all_nameservers = all_nameservers.concat(nameservers);
      console.log(nameservers);
    }
    return response.answers.reduce(function(curr, record){
      curr.push(record.data);
      return curr;
    },[])
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

var getAuthorityAnswer = function(target, nameservers){
  return new Promise(function(resolve, reject){
    function *recursive(target){
      var response;
      while(true){
        var ns = nameservers[Math.round(Math.random()*10) % nameservers.length].ip;
        response = yield dns_request_a(target, ns, 53);

        if(response._flags.rcode !== 0x00){
          reject(response._flags.rcode);
          break;
        }

        nameservers = response.additionals.reduce(function(curr, record){
        if(record.type === 'A'){
          curr.push({'name':record.name, 'ip':record.data})
        }
        return curr;
        }, [])
          
        if(nameservers.length > 0){
          //console.log('\r new ns detected!!', nameservers);
        }

        if(response._flags.aa === 0x1){
          resolve(response.answers.reduce(function(curr, record){
            if(record.type === 'A' || record.type === 'CNAME'){
              curr.push(record.data)
            }
            return curr;
          }, []));
          break;
        }
      }
    }

    var r = recursive(target);
    function step(nameservers){
        var p = r.next(nameservers);
        if(!p.done){
            p.value
            .then(function(response){
              step(response)
            })
            .catch(function(err){
              reject(err)
            })
        }
    }
    step();
  })
}

var success = 0;
var failed = 0;
var notExist = 0;
var work = async.queue(function(job, done){
  process.stdout.write(util.format('\rprogress:%d/%d/%d', success, failed, notExist));
  getAuthorityAnswer(job.subdomain, [{'ip': job.ns}])
  .then(function(response){
    success = success + 1;
    if(response.length > 0){
      console.log('\r', job.subdomain, response);
    }
    done();
  })
  .catch(function(err){
    failed = failed + 1;
    //console.log(err)
    done();
  })
  
}, 16)

work.drain = function() {
  console.log('\rfinished success:%d, failed:%d, not exist:%d', success, failed, notExist);
};

var target = 'github.com';
getAuthoritiesServers(target)
.then(function(authorityNameservers){
  return Promise.all(authorityNameservers.map(function(ns){
    return getAuthorityAnswer(ns, tld);
  }))
})
.then(function(inetAddresses){
  inetAddresses = inetAddresses.reduce(function(curr, addresses){
    return curr.concat(addresses);
  }, [])
  fs.readFile('dict', function(err, data){
      var string = data.toString('ascii');
      var subdomains = string.split('\n');
      subdomains.forEach(function(subdomain){
        work.push({
          subdomain: [subdomain, target].join('.'),
          ns: inetAddresses[Math.round(Math.random()*10) % inetAddresses.length]
        });
      });
    });
})
.catch(function(err){
  console.log(err);
})
