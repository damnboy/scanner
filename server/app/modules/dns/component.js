angular
.module('dnsModule')
.component('dnsList', {
    template : 
    '<p>{{$ctrl.records_a.length + $ctrl.records_cname.length}} subdomain of {{$ctrl.target}} </p>' +
    '<br/>'+
    '<p>status: {{$ctrl.status}} </p>'+
    '<div class="container-fluid">' + 
    '<div class="row">' + 
      '<div class="col-md-4">'+
        '<table class="table table-hover table-striped">'+
          '<thead>'+
            '<tr>'+
              '<th>domain</th>'+
              '<th>ip</th>'+
            '</tr>'+
          '</thead>'+
          '<tbody>'+
          '<tr ng-repeat="record in $ctrl.records_a">' +
              '<td>{{record.domain}}</td><td>{{record.data}}</td>'+
          '</tbody>'+
        '</table>'+
      '</div>'+
      '<div class="col-md-4">'+
      '<table class="table table-hover table-striped">'+
        '<thead>'+
          '<tr>'+
            '<th>domain</th>'+
            '<th>cname</th>'+
          '</tr>'+
        '</thead>'+
        '<tbody>'+
        '<tr ng-repeat="record in $ctrl.records_cname">' +
            '<td>{{record.domain}}</td><td>{{record.data}}</td>'+
        '</tbody>'+
      '</table>'+
    '</div>'+
    '</div>'+
    '</div>',

    controller : function dnsListController($timeout, socket)
    {
        var self = this;
        this.records_a = [];
        this.records_cname = [];
        this.target = '189.cn';
        this.status = '';
        socket.emit('dns.probe', this.target);

        socket.on('dns.record.cname', function(record){
            $timeout(function(){
                self.records_cname.push(record);
            },0)
        })

        socket.on('dns.record.a', function(record){
            $timeout(function(){
                self.records_a.push(record);
            },0)
        })

        socket.on('dns.finish', function(summary){
          $timeout(function(){
            self.status = 'done!';
          },0)
        })

    }
})