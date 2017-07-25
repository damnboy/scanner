
var getAuthorityAnswers1 = function(target){
    return new Promise(function(resolve, reject){
        function *recursive(){
            var response;
            var nameservers = tld;
            do{
                response = yield dns_request_a(target, nameservers[Math.round(Math.random()*10) % nameservers.length].ip, 53);
                
                //某些ns，即便子域名不存在，也不会返回NXDOMAIN（rcode === 3）
                if(response._flags.rcode !== 0x00){
                    reject(response._flags.rcode);
                    break;
                }

                if(response._flags.aa === 0x01){
                    var answers = response.answers.reduce(function(curr, record){
                        curr.push(record.data);
                        return curr;
                    },[]);
                    resolve(answers);
                    break;
                }

                if(response.additionals.length > 0){
                    nameservers = response.additionals.reduce(function(curr, record){
                        if(record.type === 'A'){
                        curr.push({'name':record.name, 'ip':record.data})
                        }
                        return curr;
                    }, []);
                }
                else{
                    nameservers = response.authorities.reduce(function(curr, record){
                    if(record.type === 'NS'){
                        curr.push({'name':record.data, 'ip': record.data})
                    }
                    return curr;
                    },[]);
                }
                //console.log(nameservers)
            }
            while(true);
        }

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
        }
        step();
    })
}

var getAuthorityNameServers1 = function(target){
    return new Promise(function(resolve, reject){
        function *recursive(){
            var response;
            var nameservers = tld;
            do{
                var ns = nameservers[Math.round(Math.random()*10) % nameservers.length].ip;
                response = yield dns_request_ns(target, ns, 53);
                
                if(response._flags.rcode !== 0x00){
                    reject(response._flags.rcode);
                    break;
                }

                if(response._flags.aa === 0x01){
                    /*
                    if(response.answers.length === 0){
                        console.log('No nameserver records but soa record, use the primary record in soa as nameserver :)');
                        return response.authorities.reduce(function(curr, record){
                            if(record.type === 'SOA'){
                                curr.push(record.data.primary);
                            }
                            return curr;
                        },[]);
                    }
                    */
                    var ns_addrs = response.answers.reduce(function(curr, record){
                        if(record.type === 'NS'){
                            curr.push(record.data);
                        }
                        return curr;
                    },[]);
                    resolve(ns_addrs);
                    break;
                }

                if(response.additionals.length > 0){
                    nameservers = response.additionals.reduce(function(curr, record){
                        if(record.type === 'A'){
                        curr.push({'name':record.name, 'ip':record.data})
                        }
                        return curr;
                    }, []);
                }
                else{
                    nameservers = response.authorities.reduce(function(curr, record){
                        if(record.type === 'NS'){
                            curr.push({'name':record.data, 'ip': record.data})
                        }
                        return curr;
                    },[]);
                }
                console.log(nameservers);
            }
            while(true);
        }

    
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
        }
        step();
    })    
}


function dnsManualProbe(target, nameservers){
    return co(function* () {
        return new DNSBurster({
            'target' : target,
            'nameservers' : nameservers
        });
    });
}

function dnsAutoProbe(target){
    //return new Promise(function(resolve, reject){
        //泛解析处理，生成随机字符串用于解析，查看是否能解析出ip地址
        return co(function* () {
            var trace;
            var nameservers = yield getAuthorityNameServers(target)
            .then(function(response){
                if(response._flags.rcode !== RESPONSE_CODE['NOERROR']){
                    return [];
                }
                return response.answers.reduce(function(curr, record){
                    if(record.type === 'NS'){
                        curr.push(record.data);
                    }
                    return curr;
                },[]);
            })

            nameservers = yield bluebird.filter(nameservers.map(function(ns){
                var ip = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
                if(ip.test(ns)){
                    return ns;
                }
                console.log(ns);
                return getAuthorityAnswers(ns, tld).catch(function(err){return undefined})
            }), function(answers){
                return answers !== undefined;
            })
            .then(function(responses){
                return responses.reduce(function(curr, response){
                    var addresses = response.answers.reduce(function(r, answer){
                        if(answer.type === 'A'){
                            r.push(answer.data)
                        }
                        return r;
                    },[])
                    return curr.concat(addresses);
                }, []);
            });
            /*
            nameservers = yield bluebird.mapSeries(nameservers, function(ns){
                var ip = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
                if(ip.test(ns)){
                    return ns;
                }
                console.log(ns);
                return getAuthorityAnswers(ns, tld);
            }).then(function(responses){
                return responses.reduce(function(curr, response){
                    var addresses = response.answers.reduce(function(r, answer){
                        if(answer.type === 'A'){
                            r.push(answer.data)
                        }
                        return r;
                    },[])
                    return curr.concat(addresses);
                }, []);
            });
            */
            /*
            nameservers = yield Promise.all(nameservers.map(function(ns){
                var ip = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
                if(ip.test(ns)){
                    return ns;
                }
                console.log(ns);
                return getAuthorityAnswers(ns, tld);
            }))
            .then(function(addresses){
                console.log(addresses);
                return addresses.reduce(function(curr, addresses){
                    return curr.concat(addresses);
                }, []);
            });
            */

            return dnsManualProbe(target, nameservers);
        })
        /*
        .catch(function(err){
            reject(err);
        })
        */
    //})
}