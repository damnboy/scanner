module.exports.command = 'target'

module.exports.describe = 'Scanning target domain.'

module.exports.builder = function(yargs) {
  return yargs
    .strict()
    .option('target', {
      alias: 't'
    , describe: 'target domain.'
    , type: 'string'
    , demand: true
    })
    .option('nameservers', {
      alias: 'ns'
      , describe: 'custom nameservers.'
      , type: 'string'
      , demand: false
    })
}

module.exports.handler = function(argvs){

  var ip = require('ip');
  var _ = require('lodash');
  var dict = require('./utils/dict');
  var dns = require('./libs/dns');
  var WebBanner = require('./libs/http/banner');
  var IPWhois = require('./libs/whois')

  var whois = new IPWhois();
  whois.on('finish', function(summary){
    console.log('------------- Whois Report ---------------------')
    Object.keys(summary).forEach(function(k){
      console.log(k);
      summary[k].forEach(function(i){
        console.log(i)
      })
    })
    console.log('------------- Whois Report ---------------------')
  })
  var banner = new WebBanner();
  banner.on('finish', function(summary){
    console.log('------------- Web Application Banner Report ---------------------')
    summary.forEach(function(i){
      console.log(i.url, i.title)
    })
    console.log('------------- Web Application Banner Report ---------------------')
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

      banner.host(addr, 80)      
      whois.whois(addr);

      console.log(addr)
    })
    console.log('----- IP ------ \r\n');

  })


  dict.getTxtDict('./libs/dns/dicts/top3000')
  .then(function(dict){
      
      var target = argvs.target;
      var nameservers = argvs.nameservers;
      console.log(nameservers)
      if(nameservers === undefined){
        dns_prober.on('failed', function(trace){
          console.log('dns probe failed, try last dns trace stack records as authority nameservers\r\n');
          var nameservers = trace[trace.length - 1].reduce(function(ret, record){
              return ret.concat(record.ip)
          }, [])
          dns_prober.manualProbe(target, nameservers, dict)
        });
  
        dns_prober.autoProbe(target, dict);
      }
      else{
        dns_prober.manualProbe(target, nameservers.split(','), dict);
      }

  });
}
