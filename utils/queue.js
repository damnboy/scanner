var async = require('async');
var events = require('events');
var util = require('util');

function Queue(paralles){

    var self = this;
    events.EventEmitter.call(this);

    this.works = async.queue(function(job, done){
        //done 多次调用会引发callback already called异常
        job()
        .then(function(result){
            self.emit('done', result);
            done()
        })
        .catch(function(err){
            self.emit('error', err);
            done()
        })

    }, paralles)


    //当前队列为空时触发该回调
    this.works.drain = function() {
        
    };
}

util.inherits(Queue, events.EventEmitter);//使这个类继承EventEmitter

Queue.prototype.enqueue = function(job){
    this.works.push(job)
}

module.exports = Queue;
/*
var q = new Queue(32);

q.on('result', function(r){
    console.log(r)
})

q.on('error', function(e){
    console.log(e)
})

q.enqueue(function(){
    return new Promise(function(resolve, reject){
        var fs = require('fs');
        fs.readFile('/etc/passwd', function(err, data){
            if(err){
                reject(err)
            }
            else{
                resolve(data)
            }
        })
    })
})
*/

