var child_process = require("child_process");
var log = require('./logger').createLogger('[util:external-nmap]')
var path = require("./path.js")
module.exports.portScanner = function(ip){
    return new Promise(function(resolve, reject){
        var scanResult = {
            "ip" : ip,
            "tcp" : [],
            "udp" : []
        };

        var proc = child_process.spawn(path.utils('bin/nmap-7.11'),[
            ip,
            '-vv',
            '-n',
            '-Pn',
            '-p-',
            '--min-rate','1000'
        ]);

        proc.stdout.on('data', function(data){
            var output = data.toString('utf-8')
            var reg = /open port (\d*)\/(\w*)/g;
            var result = reg.exec(output, 'i');
            if(result){
                if(result[2] === 'tcp'){
                    scanResult["tcp"].push(result[1])
                }
                else if(result[2] === 'udp'){
                    scanResult["udp"].push(result[1])
                }
                else{
                    ;
                }
                log.info(ip + ' ' + result[1] + '/' + result[2]);
            }
            
        })

        proc.stderr.on('data', function(data){
            log.warn(data.toString('utf-8'))
        })

        proc.on('exit', function(code, signal){
            if(code === 0){
                resolve(scanResult)
            }
            else{
                log.warn('nmap exit unexcepted with code: ' + code)
                reject(code);
            }
        })
    })
}
