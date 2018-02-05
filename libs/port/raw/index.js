const net = require('net');
var timeout = 2000;
function port(options, payload){
    return function open(){
        return new Promise(function(resolve, reject){
            var banner;
            var socket = net.createConnection(options, function(s){
                setTimeout(function(){
                    socket.destroy();
                    //console.log(options.host, options.port, 'Connection Timeout');
                }, timeout);
            });
        
            socket.on('data', function(data){
                options.banner = data;
                options.bannerText = data.toString('utf-8');
                socket.end();
            });
    
            socket.on('close', function(){
                socket.destroy();

                if(options && options.banner){
                    resolve(options);
                }
                else{
                    reject(options);
                }                
            });
    
            socket.setTimeout(timeout, function(){
                socket.destroy();
                //console.log(options.host, options.port, 'Connecting Timeout');
            });
    
            socket.on('error', function(err){
                socket.destroy()
                //console.log(options.host, options.port, 'Connection Error')
                reject('Connection Error');
            });    

            if(payload){
                socket.write(payload);
            }
        })
    }
}

function passivePort(options){
    return port(options);
}
    
function webPort(options){
    var payload = 'GET / HTTP/1.0\r\n\r\n';
    return port(options, payload);
}

/*
function sslPort(options){
    var payload = fs.readFileSync('./payloads/ssl.bin', {
        encoding : "binary"
    });
    return port(options, payload);
}

var fs = require('fs');
var Q = require('./q.js');
function readPayload(binFile){
    return new Promise(function(resolve, reject){
        fs.readFile(binFile, function(err, data){
            if(err){
                reject(err);
            }
            else{                
                resolve(data);
            }
        });
    });
}




function readHostList(textFile){
    return new Promise(function(resolve, reject){
        fs.readFile(textFile, function(err, data){
            if(err){
                reject(err);
            }
            else{
                var lines = data.toString('utf-8').split('\n');
                
                resolve(lines.reduce(function(ret, line){
                    var socket = line.split(':');
                    if(socket.length === 2){
                        ret.push({
                            "host" : socket[0],
                            "port" : socket[1]
                        })
                    }
                    return ret;
                }, []));
            }
        });
    });
}

function staticVar(){
    
    var ip = "192.30.255.112";
    var ports = [
        443
      ];

    return Promise.resolve(ports.map(function(port){
        return {
            host : ip,
            port : port
        }
    }))
}
var passivePortCount = 0;
//readHostList('./tests/100.txt')
staticVar()
.then(function(r){
    console.log(r.length + ' hosts from host.txt');
    var q = new Q(16, r, sslPort);
    q.on('done', function(banner){
        console.log(banner);
        passivePortCount  = passivePortCount + 1;
    })

    q.on('error', function(error){
        //console.log(error)
    })

    q.on('empty', function(){
        console.log(passivePortCount + ' Passive Port');
    })
})
.catch(function(err){
    console.log(err)
})
*/


