angular
.module('debugModule')
.component('debugList', {
    template : 'Server says: {{ $ctrl.message }}',
    controller : function debugListController($timeout, socket){
        var self = this;

        this.count = 1;
        //在Angular的Controller中，如果直接使用setInterval，是没有效果的，它只会单向绑定一次，要用它提供的$interval这个服务才行
        //执行完毕之后，需要调用$interval.cancel(promise)手动销毁

        this.$onInit = function(){

        }

        this.$onDestroy = function(){
            $timeout.cancel(this.stop);
        }
        
        socket.on('message', function(msg){
            $timeout(function(){
                self.message = msg;
            },0)
        })

        
        /*
        周期性的调度函数
        http://tutorials.jenkov.com/angularjs/timeout-interval.html

        If the function you schedule for execution makes changes to 
        variables in the $scope object, any other variable which your application is watching, 
        your application needs to execute $scope.$digest() after the scheduled function call finishes. 
        在callback中执行的变量更新，不会得到反馈。需要手动调用$scope.$digest()进行更新操作。

        Why that is necessary is explained in my tutorial about $watch(), $digest() and $apply().
        http://tutorials.jenkov.com/angularjs/watch-digest-apply.html

        $scope.$watch 监视$scope上创建了双向数据绑定的对象
        
        $scope.$watch(
            function value(scope){
                返回一个受监视的对象
            },
            function listener(new, ole){
                当受监视对象发生改变时，触发此方法

            })

        $scope.$digest 遍历所有$watch，检查是否对象是否改变。并调用创建watch时所设定的callback

        大多数情况下，框架会自动完成$watch与$digest的调用，但在某些特殊场景下，可能需要手工完成这些步骤。

        $scope.$apply 在执行指定的代码之后，调用$scope.$digest

        

        



        By default AngularJS already calls $digest() after the scheduled function call finishes, so you don't have to do that explicitly. 
        You can, however, specify if AngularJS should not call $digest() after the scheduled function call. 
        If, for instance, your scheduled function call only updates an animation but does not change any $scope variables, then it is a waste of CPU time to call $digest() after the function finishes.

        Both $timeout and $interval have a third, optional parameter which can specify if the $digest() method is to be executed after the scheduled function finishes. 
        Actually, the third parameter specifies if the call to the scheduled function should be done inside an $apply() call. 
        Here is an example of how to use this third parameter:

            $interval( function(){ $scope.callAtInterval(); }, 3000, true);

            $interval( function(){ $scope.callAtInterval(); }, 3000, false);

        These two $interval examples both have a third parameter passed to the $interval service. T
        his parameter can be either true or false. 
        A value of true means that the scheduled function should be called inside an $apply() call. 
        A value of false means that it should not be called inside an $apply() call (meaning $digest() will not get called after the scheduled function finishes). 

        */
    }
})