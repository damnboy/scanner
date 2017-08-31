//https://cdnjs.com/libraries/socket.io
angular
.module('socketModule')
.factory('socket', [function(){
    var socket = io('http://localhost:3000');
    
    console.log('init');
    
    socket.on('connect', onConnect);
    
    function onConnect(){
      console.log('connect ' + socket.id);
    }
    
    return socket;
}])