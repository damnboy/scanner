var dns = require('./');
var dict = require('../../utils/dict');
var ip = require('ip');
var _ = require('lodash');

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

dns_prober.on('failed', function(trace){
  console.log('dns probe failed, got dns trace information from target domain\r\n');
  //dns.DNSProber.emit('trace',trace);
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
    console.log(addr)
  })
  console.log('----- IP ------ \r\n');

})

dict.getTxtDict('./dicts/dns-top3000')
.then(function(dict){
    dns_prober.autoProbe('github.com', dict);
});