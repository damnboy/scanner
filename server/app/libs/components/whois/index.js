module.exports = 
angular.module('whoisModule',[])
.component('whoisRecords',{
    require : {
        dnsList : '^dnsList'
    },
    template : '',
    controller : function whoisRecordsController(){
        var ctrl = this;

        ctrl.$onInit = function(){
            alert(ctrl.dnsList);
        }
    }
})