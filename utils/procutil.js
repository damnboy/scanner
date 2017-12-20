var child_process = require("child_process");
var log = require('./logger').createLogger('[util:procutil]')
var util = require("util");

module.exports.fork = function (script, args){
    return new Promise(function(resolve, reject){
        log.info('Forking "%s %s"', script, args.join(' '));

            var proc = child_process.fork(script, args,
                {
                    /*
                        "cwd" : <string> Current working directory of the child process.
                        "env" : <Object> Environment key-value pairs.
                        "execPath" : "<string> Executable used to create the child process. 默认继承父进程"
                        "execArgv" : <Array> List of string arguments passed to the executable. Default: process.execArgv
                        "silent" : <boolean> If true, stdin, stdout, and stderr of the child will be piped to the parent, otherwise they will be inherited from the parent, see the 'pipe' and 'inherit' options for child_process.spawn()'s stdio for more details. Default: false
                        "stdio" : <Array> Supports the array version of child_process.spawn()'s stdio option. When this option is provided, it overrides silent. The array must contain exactly one item with value 'ipc' or an error will be thrown. For instance [0, 1, 2, 'ipc'].
                            用来配置父子进程之间的管道
                        "uid" : <number> Sets the user identity of the process (see setuid(2)).
                        "gid" : <number> Sets the group identity of the process (see setgid(2)).
                    */
                }
            );

            /*
                另外还有一点需要注意，针对关机和重启的情况，是由操作系统按PID正序逐个发送SIGTERM，通知大家“做好准备，要关机了”，随后（n秒后）
                会下最后通谍——SIGKILL。对于子进程来说，父进程由于PID小，会先收到SIGTERM，收到后会立即向子进程发SIGKILL结束子进程。这样
                很可能会造成子进程接收不到操作系统发的SIGTERM，还未进行收尾工作就被终止。
                所以，还是尽量在主进程做收尾工作，或者主进程收到SIGTERM后主动向子进程发送SIGTERM
            */

            process.on('SIGINT', function() {
                log.info("sending sigint signal to process("+ proc.pid +")");
                proc.kill('SIGINT');
            });

            process.on('SIGTERM', function() {    
                log.info("sending sigint signal to process("+ proc.pid +")");
                proc.kill('SIGTERM');
            });


            proc.on('error', function(){

            });

            proc.on('exit', function(code, signal){
                log.info(util.format("child process exit code : %s, signal: %s", code, signal))
                if (signal) {
                    resolve(signal)
                }
                else if (code > 0 
                    && code !== 130 //Script terminated by Control-C	Ctl-C	Control-C is fatal error signal 2, (130 = 128 + 2, see above)
                    && code !== 143) {
                    reject(code)
                }
                else {
                    resolve(code)
                }
            });

            /*
                proc.on('close', function(code, signal){

                })

                proc.on('disconnect', function(){

                })


                proc.on('message', function(message){

                });
            */
    })
     
};


