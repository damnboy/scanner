var _ = require('lodash')

module.exports = 
angular.module('dnsModule',[
])
.component('dnsRecordsA', require('./records/a/'))
.component('dnsRecordsCname', require('./records/cname/'))

.component('dnsList', {
    transclude: true,
    template : 
    '<p>{{$ctrl.records.a.length + $ctrl.records.cname.length}} subdomain of {{$ctrl.target}} {{$ctrl.status}} </p>' +
    '<input type="text" ng-model=$ctrl.target></input>'+
    '<button ng-click="$ctrl.onProbe()">probe</button>'+
    '<div class="container-fluid">' + 
    '<div class="row">' + 
      '<dns-records-a></dns-records-a>'+
      '<dns-records-cname></dns-records-cname>'+
    '</div>'+
    '</div>',
    controller : function dnsListController($timeout, socket, fakeDatabase)
    {
        var ctrl = this;

        this.target = '';
        
        function init(){
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
            ctrl.status = 'done!';

            fakeDatabase['records'] = ctrl.records;
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