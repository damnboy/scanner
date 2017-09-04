module.exports = {
    templateUrl : './libs/components/probe/template.html',
    controller : function probeController(socket, fakeDatabase){
        var ctrl = this;
        ctrl.onWhois = function(){
            var public = fakeDatabase.records.a.map(function(i){
                return i.data;
            });
    
            public = _.uniq(public.sort()).map(function(ip){
                return {
                    'ip' : ip
                }
            });

            socket.emit('whois.ip', public);
        }
    }
}