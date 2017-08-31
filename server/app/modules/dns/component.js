angular
.module('dnsModule')
.component('dnsList', {
    template : 
    '<p>Total number of subdomain: {{$ctrl.records.length}}</p>' +
    '<ul>' +
        '<li ng-repeat="record in $ctrl.records">' +
        '<span>{{record.domain}}</span>' +
        '<p>{{record.data}}</p>' +
        '</li>' +
    '</ul>',
    controller : function dnsListController($timeout, socket)
    {
        var self = this;
        this.records = [];
        socket.emit('dns.probe', 'qq.com')
        socket.on('dns.record', function(record){
            $timeout(function(){
                self.records.push(record);
            },0)
        })
    }
})