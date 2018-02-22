var async = require('async');
var events = require('events');
var util = require('util');
/*
Usage:

Events:
    done
    error
    empty
*/
function Queue(paralles, paramsArray, promiseJobGenerator){

    this._paralles = paralles;
    this._paramsArray = paramsArray;
    this._promiseJobGenerator = promiseJobGenerator;

    var self = this;
    events.EventEmitter.call(this);

    function addJob(){
        if(self._paramsArray.length !== 0){
            self.works.push(self._promiseJobGenerator(self._paramsArray.shift()));
        }
    }

    this.works = async.queue(function(promise, done){
        //done 多次调用会引发callback already called异常
        promise()
        .then(function(result){
            self.emit('done', result);
            done();
            addJob();
        })
        .catch(function(err){
            self.emit('error', err);
            done();
            addJob();
        })

    }, paralles);

    //当前队列为空时触发该回调
    this.works.drain = function() {
        self.emit('empty');
    };

    var start = new Array(self._paramsArray.length > self._paralles ? self._paralles: self._paramsArray.length);
    start.fill('');
    start.forEach(function(params){
        addJob();
    });
}

util.inherits(Queue, events.EventEmitter);//使这个类继承EventEmitter

Queue.prototype.addJob = function(params){
    this.works.push(this._promiseJobGenerator(params));
}

module.exports = Queue;
