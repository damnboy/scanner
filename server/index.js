var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var dns = require('../libs/dns');
var dict = require('../utils/dict');
var log = require('../utils/logger.js');
var logger = log.createLogger('[PROBE-SERVER]');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

    var dns_prober = new dns.DNSProber();
    dns_prober.on('trace', function(trace){
        
      })
    
    dns_prober.on('error', function(error){
        console.log(error)
    })

    dns_prober.on('record.a', function(record){
        socket.emit('dns.record.a', record);
    })

    dns_prober.on('record.cname', function(record){
        socket.emit('dns.record.cname', record);
    })
    
    dns_prober.on('finish', function(summary){
        socket.emit('dns.finish', summary);
    })

    socket.on('dns.probe', function(target){
        
        dict.getTxtDict('./libs/dns/dicts/dns-top3000')
        .then(function(dict){

            dns_prober.on('failed', function(trace){
              
              var nameservers = trace[trace.length - 1].map(function(record){
                return record.ip;
              })
              dns_prober.manualProbe(target, nameservers, dict)
            })

            dns_prober.autoProbe(target, dict);
        });
    })
    
    /*
    var cnt = 1;
    setInterval(function(){
        cnt = cnt + 1;
        socket.emit('message', 'connection has establishing for ' + cnt  + 's')
    },1000)
  console.log('a user connected');
  */
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});