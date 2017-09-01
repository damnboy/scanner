var io = require('socket.io-client');
module.exports = 
angular.module('socketModule',[])
.factory('socket', [function(){
    var socket = io('http://localhost:3000');
    
    console.log('init');
    
    socket.on('connect', onConnect);
    
    function onConnect(){
      console.log('connect ' + socket.id);
    }
    
    return socket;
}])