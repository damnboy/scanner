
/*
    
    启动与并行控制：
        用bluebird来同时启动诺干进程，bludbird可以控制处于unsolved状态的promise对象的数量

        进程的创建包装成一个返回promise的方法：
            启动：挂起状态
            正常退出：resolve
            异常退出：reject

        进程启动参数：

    退出与销毁：
        父进程收到SIGN_XXX 之后，会依次提交给子进程，
        信号处理参考文档中的详细描述https://nodejs.org/docs/latest-v6.x/api/process.html
        鉴于openstf中procutil的实现，https://github.com/openstf/stf/blob/master/lib/util/procutil.js
        只需要处理SIGINT与SIGTERM即可:
            这两个信号在非windows平台上均有默认的信号处理函数，如果重新改信号处理函数，默认的行为将会改变（nodejs进程不会自动结束）
            SIGINT
                由ctrl＋c触发
            SIGTERM

        

    交互：

    
*/


var child_process = require("child_process");

var proc = child_process.fork("../test/timeout.js", 
    [
        "-p" , "p1",
        "-a" , "p2"
    ],
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


proc.on('close', function(code, signal){

})

proc.on('disconnect', function(){

})

proc.on('error', function(){

});

proc.on('exit', function(code, signal){

});

proc.on('message', function(message){

});


/*
    另外还有一点需要注意，针对关机和重启的情况，是由操作系统按PID正序逐个发送SIGTERM，通知大家“做好准备，要关机了”，随后（n秒后）
    会下最后通谍——SIGKILL。对于子进程来说，父进程由于PID小，会先收到SIGTERM，收到后会立即向子进程发SIGKILL结束子进程。这样
    很可能会造成子进程接收不到操作系统发的SIGTERM，还未进行收尾工作就被终止。
    所以，还是尽量在主进程做收尾工作，或者主进程收到SIGTERM后主动向子进程发送SIGTERM
*/

process.on('SIGINT', function() {
    proc.kill('SIGINT');
});

process.on('SIGTERM', function() {    
    proc.kill('SIGTERM');
});

