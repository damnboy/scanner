var _ = require('lodash')
module.exports = 
angular.module('dnsModule',[
])
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
    controller : function dnsARecordsController(){

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
    controller : function DnsCnameRecordsController(){
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
            '<th><button ng-click="$ctrl.dnsList.onWhois()">whois</button></th>'+
          '</tr>'+
        '</thead>'+
        '<tbody>'+
        '<tr ng-repeat="record in $ctrl.dnsList.public">' +
            '<td>{{record.ip}}</td>'+
            '<td>{{record.detail[0].netname}}</td>'+
            '<td>{{record.detail[0].netblock}}</td>'+
        '</tbody>'+
      '</table>'+
    '</div>',
    controller : function publicRecordsController(){
        var ctrl = this;
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
        var ctrl = this;

        this.target = '';
        
        function init(){
            ctrl.public = [];
            ctrl.records = {
                'a' : [],
                'cname' : []
            };
            ctrl.status = '';
        }

        ctrl.onProbe = function(){
            init();
            socket.emit('dns.probe', this.target);
        }
    
        ctrl.onWhois = function(){
            socket.emit('whois.ip', ctrl.public);
            ctrl.public = [];
        }

        socket.on('whois.record', function(record){
            $timeout(function(){
                ctrl.public.push(record)
            },0);
        })

        socket.on('dns.record.a', function(record){
            $timeout(function(){
                ctrl.records.a.push(record);
            },0)
        })

        socket.on('dns.record.cname', function(record){
            $timeout(function(){
                ctrl.records.cname.push(record);
            },0)
        })

        socket.on('dns.finish', function(summary){
          $timeout(function(){
            var public = ctrl.records.a.map(function(i){
                return i.data;
            });
            ctrl.public = _.uniq(public.sort()).map(function(ip){
                return {
                    'ip' : ip
                }
            });
            ctrl.status = 'done!';
          },0)
        })

    }
})

/*

仅控制其定义的数据以及模版：
    职责清晰，不应该修改其作用域范围之外的的数据以及DOM。
    即便angular提供了这种接口：$scope与$scope.$watch

清晰的公共接口－输入与输出：
    因为双向绑定的存在，使得通过bindings:{item:'='}所传入component的对象，在component内部进行修改成为可能。
    因此必须遵守一些规范，来避免这种行为的发生：
    入参仅使用<与@方式绑定
        < 单向绑定
            父组件与子组件引用的依然是同一个对象，只不过该对象没有注册watch方法，发生变化之后在页面中不会马上体现出来。
        @ 字符串类型的参数使用
            适用于不做任何修改的参数

    出参适用&方式进行绑定
        一般用来传递作为callback的函数

    以callback的形式，告知数据的所有者对数据进行操作，由数据的拥有者来决定对数据做何种操作。



生命周期管理
    预定义的callback
    $onInit()
    $onChanges(changesObj)
    $doCheck()
    $onDestory()
    $postLink()

应用程序接口
    组件树


    








父子component之间的通讯

directives可以require其他directives的controller达到directives之间相互通信的目的
在component中可以通过require属性提供一个object mapping达到同样的效果

被包含的controller在引用其的controller初始化的时候无法引用，在$onInit方法被调用时，才能引用。

*/