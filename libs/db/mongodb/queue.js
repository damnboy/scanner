var settings = require('../../../settings');
var db = require('./conn')(settings.db.mongodb);
var mongoDbQueue = require('mongodb-queue');
var bluebird = require('bluebird');

/*
    custom error in bluebird catch block
    http://bluebirdjs.com/docs/api/catch.html
*/
function QueueEmpty(message) {
    this.message = message;
    this.name = "QueueEmpty";
    Error.captureStackTrace(this, QueueEmpty);
}

QueueEmpty.prototype = Object.create(Error.prototype);

function Q(){

}

Q.prototype.queue = function (name){
    return db.connect()
    .then(function(d){
        return mongoDbQueue(d.db('queue'), name);
    });
}

Q.prototype.getTask = function(name){

    var self = this;
    return new bluebird.Promise(function(resolve, reject){
        return self.queue(name)
        .then(function(q){
            q.get(function(error, message){
                if(error){
                    reject(error)
                }
                else{
                    if(message){
                        resolve(message);
                    }
                    else{
                        resolve('empty');
                    }
                }
            })
        })
    })
    .then(function(task){
        if(typeof task === 'object'){
            return task
        }
        else{
            throw new QueueEmpty(name + ' is empty');
        }
    })
}

Q.prototype.getServiceTask = function (){
    return this.queue('ports');
}

Q.prototype.getwhoisTask = function (){
    return this.getTask('whois')
}

Q.prototype.getSSLTask = function (){
    return this.queue('ssl');
}

Q.prototype.getWebTask = function (){
    return this.queue('web');
}

Q.prototype.getNmapBannerTask = function (){
    return this.queue('nmapbanner');
}

module.exports.Q = new Q();
module.exports.QueueEmpty = QueueEmpty;