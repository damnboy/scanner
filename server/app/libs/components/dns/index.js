var _ = require('lodash')
module.exports = 
angular.module('dnsModule',[])
.component('dnsARecords',{
    require : {
        dnsList : '^dnsList'
    },
    transclude: true,
    template :
    '<div class="col-md-4">'+
      '<table class="table table-hover table-striped">'+
        '<thead>'+
          '<tr>'+
            '<th>domain({{$ctrl.dnsList.records.a.length}})</th>'+
            '<th>ip</th>'+
          '</tr>'+
        '</thead>'+
        '<tbody>'+
        '<tr ng-repeat="record in $ctrl.dnsList.records.a">' +
            '<td>{{record.domain}}</td><td>{{record.data}}</td>'+
        '</tbody>'+
      '</table>'+
    '</div>',
    controller : function dnsARecordsController($timeout, socket){
        var self = this;
        self.$onInit = function(){
            socket.on('dns.record.a', function(record){
                $timeout(function(){
                    self.dnsList.records.a.push(record);
                },0)
            })
        }
    }
})
.component('dnsCnameRecords',{
    require : {
        dnsList : '^dnsList'
    },
    transclude: true,
    template :
    '<div class="col-md-4">'+
      '<table class="table table-hover table-striped">'+
        '<thead>'+
          '<tr>'+
            '<th>domain({{$ctrl.dnsList.records.cname.length}})</th>'+
            '<th>cname</th>'+
          '</tr>'+
        '</thead>'+
        '<tbody>'+
        '<tr ng-repeat="record in $ctrl.dnsList.records.cname">' +
            '<td>{{record.domain}}</td><td>{{record.data}}</td>'+
        '</tbody>'+
      '</table>'+
    '</div>',
    controller : function DnsCnameRecordsController($timeout, socket){
        var self = this;
        self.$onInit = function(){
            socket.on('dns.record.cname', function(record){
                $timeout(function(){
                    self.dnsList.records.cname.push(record);
                },0)
            })
        }
    }
})
.component('publicRecords',{
    require : {
        dnsList : '^dnsList'
    },
    transclude: true,
    template :
    '<div class="col-md-4">'+
      '<table class="table table-hover table-striped">'+
        '<thead>'+
          '<tr>'+
            '<th>ipv4({{$ctrl.dnsList.public.length}})</th>'+
          '</tr>'+
        '</thead>'+
        '<tbody>'+
        '<tr ng-repeat="record in $ctrl.dnsList.public">' +
            '<td>{{record}}</td>'+
        '</tbody>'+
      '</table>'+
    '</div>',
    controller : function publicRecordsController(){
    }
})
.component('dnsList', {
    transclude: true,
    template : 
    '<p>{{$ctrl.records.a.length + $ctrl.records.cname.length}} subdomain of {{$ctrl.target}} {{$ctrl.status}} </p>' +
    '<input type="text" ng-model=$ctrl.target></input>'+
    '<button ng-click="$ctrl.onProbe()">probe</button>'+
    '<div class="container-fluid">' + 
    '<div class="row">' + 
      '<dns-a-records></dns-a-records>'+
      '<dns-cname-records></dns-cname-records>'+
      '<public-records></public-records>'+
    '</div>'+
    '</div>',
    controller : function dnsListController($timeout, socket)
    {
        var self = this;
        this.public = [];
        this.records = {
            'a' : [],
            'cname' : []
        };
        this.target = '';
        this.status = '';

        self.onProbe = function(){
            socket.emit('dns.probe', this.target);
        }
    
        socket.on('dns.finish', function(summary){
          $timeout(function(){
            var public = self.records.a.map(function(i){
                return i.data;
            });
            self.public = _.uniq(public.sort());
            self.status = 'done!';
          },0)
        })

    }
})

/*
component之间的通讯

directives可以require其他directives的controller达到directives之间相互通信的目的
在component中可以通过require属性提供一个object mapping达到同样的效果

被包含的controller在引用其的controller初始化的时候无法引用，在$onInit方法被调用时，才能引用。

*/