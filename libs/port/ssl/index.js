/*
    https://www.owasp.org/index.php/Testing_for_SSL-TLS_(OWASP-CM-001)


    issue:
        socket hang up https://github.com/nodejs/node/issues/16997

        ECONNREFUSED
        ECONNRESET

        140735207179024:error:140770FC:SSL routines:SSL23_GET_SERVER_HELLO:unknown protocol:../deps/openssl/openssl/ssl/s23_clnt.c:794:

        140735207179024:error:14082174:SSL routines:ssl3_check_cert_and_algorithm:dh key too small:../deps/openssl/openssl/ssl/s3_clnt.c:3635:

        140735207179024:error:14094410:SSL routines:ssl3_read_bytes:sslv3 alert handshake failure:../deps/openssl/openssl/ssl/s3_pkt.c:1493:SSL alert number 40


        { Error: unable to verify the first certificate
            at TLSWrap.ssl.onhandshakedone (_tls_wrap.js:440:38) code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' }
        { Error: self signed certificate
            at TLSWrap.ssl.onhandshakedone (_tls_wrap.js:440:38) code: 'DEPTH_ZERO_SELF_SIGNED_CERT' }
        { Error: certificate has expired
            at TLSWrap.ssl.onhandshakedone (_tls_wrap.js:440:38) code: 'CERT_HAS_EXPIRED' }


*/
var net = require('net');
var tls = require('tls');
var fs = require('fs');
var log = require('../../../utils/logger').createLogger('[SSL]');
var Q = require('../../../utils/q.js')
var util = require('util');
var events = require('events')
var timeout = 5000;

function generatorSSLConnection (options){
    return function (){
        var connected = false;
        var _handle;
        return new Promise(function(resolve, reject){
            var socket =  new net.Socket();
            var tlsSocket = tls.connect({
                "socket" : socket,
                /*"rejectUnauthorized" : false,*/
                "checkServerIdentity" : function(servername, cert){
                    //
                }
            }, function(){
                //console.log('client connected',tlsSocket.authorized ? 'authorized' : 'unauthorized');
                options.cert = tlsSocket.getPeerCertificate();
                //log.info(options.host, options.port, ssl.cert.subject.CN)
                //console.log('------');
                //console.log(options.host + ':' + options.port + ' ' + ssl.cert.subject.CN);
                //console.log( ssl.cert.subjectaltname);
                //fs.writeFile('./crts/' + options.host+'.'+options.port + '.crt', ssl.cert.raw);
                //console.log('------');
                
                socket.destroy();
                resolve(options);
            })

            tlsSocket.on('connect', function(){
                _handle = tlsSocket._handle;
            })

            tlsSocket.on('error', function(err){
                tlsSocket.destroy();
                if(_handle){
                    var cert = _handle.getPeerCertificate();
                    if(Object.keys(cert).length !== 0){
                        options.warning = err.message;
                        if(err.message.split(':').length > 1){
                            options.warning = err.message.split(':')[5];
                        }
                        
                        options.cert = cert;
                        log.error('%s on %s:%d %s' ,options.warning.toUpperCase(), options.host , + options.port , options.cert.subject.split('\n').join(' '))
                        resolve(options);
                    }
                }
                else{
                    reject({
                        host:options.host,
                        port:options.port,
                        err : err.message
                    });
                }
            })

            tlsSocket.on('OCSPResponse', function(buffer){
                console.log(buffer);
            })

            socket.setTimeout(timeout, function(){
                if(connected){
    
                }
                else{
                    socket.destroy();
                    reject({
                        host:options.host,
                        port:options.port,
                        err : 'connecting timeout'
                    });
                }
            });

            socket.connect(options, function(){
                connected = true;
                setTimeout(function(){
                    socket.destroy();
                    reject({
                        host:options.host,
                        port:options.port,
                        err : 'handshake timeout'
                    });        
                }, timeout);
            });
        });
    };
}

function SSLScanner(options) {//新建一个类
    events.EventEmitter.call(this);
}

util.inherits(SSLScanner, events.EventEmitter);//使这个类继承EventEmitter

//'./host.txt'

SSLScanner.prototype.scanHosts = function(hosts){
    var self = this;
    hosts.forEach(function(host){
        self.q.addJob(host);
    });
}

SSLScanner.prototype.scanHost = function(host){
    return this.scanHosts([host]);
}

SSLScanner.prototype.start = function(){

    var self = this;
    this.q = new Q(8, [], generatorSSLConnection);
    this.q.on('done', function(banner){
        if(banner.warning){
            log.error(banner.warning.toUpperCase(), banner.host + ':' + banner.port + ' ' + banner.cert.subject.split('\n').join(' '))
        }
        else{
            log.info(banner.host, banner.port, banner.cert.subject.CN);
        }


        self.emit('ssl', banner.host, banner.port, banner.cert);
    });

    this.q.on('error', function(error){
        //console.log(error);
        var c = ['ECONNRESET', 'unknown protocol', 'socket hang up', 'handshake timeout', 'connecting timeout'].reduce(function(cnt, errMsg){
            var r = error.err.search(errMsg);
            if( r >= 0){
                cnt = cnt + 1;
            }
            return cnt;
        }, 0);

        if(c === 0){
            log.warn(error.host, error.port, error.err);
        }

        self.emit('nonssl', error.host, error.port);
    })

    this.q.on('empty', function(){
        self.emit('done')
    })

}

module.exports = SSLScanner;