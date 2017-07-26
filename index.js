var dns = require('./libs/dns');
var dict = require('./utils/dict');
var ip = require('ip');
var _ = require('lodash');

var banner = require('./libs/http/banner');

banner.on('job_done', function(job){
    console.log('[%d]%s\t%s', job.statusCode, job.request.uri, job.title);
})

banner.on('job_error', function(job){

})

var dns_prober = new dns.DNSProber();
dns_prober.on('error', function(error){
  console.log('error', error);
})

dns_prober.on('trace', function(trace){
  trace.forEach(function(level){
     console.log('------')
    level.forEach(function(ns){
      console.log(ns);
    })
     console.log('------')
  })
})

dns_prober.on('info', function(info){
  console.log(info.message);
})

dns_prober.on('response', function(response){
  console.log(response)
})

dns_prober.on('finish', function(summary, public, cname, private, wildcard){

  console.log('----- Summary ------ \r\n');
  Object.keys(summary).forEach(function(key){
    console.log('%s : %s' ,key, summary[key]);
  })
  console.log('----- Summary ------ \r\n');

  console.log('----- Public ------ \r\n');
  public.forEach(function(record){
    console.log(record)
    banner.emit('job', {
        "hosts" : [record.domain],
        "ports" : ['80', '8080']
    })
  })
  console.log('----- Public ------ \r\n');

  console.log('----- CName ------ \r\n');
    cname.forEach(function(record){
    console.log(record)
  })
  console.log('----- Cname ------ \r\n');

  console.log('----- Private ------ \r\n');
    private.forEach(function(record){
    console.log(record)
  })
  console.log('----- Private ------ \r\n');

  console.log('----- Wildcard ------ \r\n');
    wildcard.forEach(function(record){
    console.log(record)
  })
  console.log('----- Wildcard ------ \r\n');

  console.log('----- IP ------ \r\n');
  var ip_addr = public.map(function(record){
    return record.data
  }).sort();
  _.uniq(ip_addr).forEach(function(addr){

    banner.emit('job', {
        "hosts" : [addr],
        "ports" : ['80', '8981','8071','8080']
    })
    console.log(addr)
  })
  console.log('----- IP ------ \r\n');

})


dict.getTxtDict('./libs/dns/dicts/dns-top3000')
.then(function(dict){

    var target = 'github.com';

    dns_prober.on('failed', function(trace){
      console.log('dns probe failed, try last dns trace stack records as authority nameservers\r\n');
      var nameservers = trace[trace.length - 1].map(function(record){
        return record.ip;
      })
      dns_prober.manualProbe(target, nameservers, dict)
    })

    dns_prober.autoProbe(target, dict);
});
