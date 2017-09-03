module.exports = {
    templateUrl : './libs/components/whois/template.html',
    controller : function whoisRecordsController($timeout, fakeDatabase, socket){
        var ctrl = this;

        socket.on('whois.record', function(record){
            $timeout(function(){
                record.detail.forEach(function(r){
                    if(ctrl.items[r.netname] === undefined){
                        ctrl.items[r.netname] = [];
                    }

                    ctrl.items[r.netname].push(r.netblock);

                    ctrl.items[r.netname] = _.uniq(ctrl.items[r.netname]);
                })

                ctrl.whois = Object.keys(ctrl.items);

            },0);
        })

        ctrl.$onInit = function init(){
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

        
        ctrl.items = {

        };

        ctrl.whois = Object.keys(ctrl.items);

    }

}
/*
.component('whoisList',{
    transclude: true,
    template :
    '<div class="col-md-12">'+
      '<table class="table table-hover table-striped">'+
        '<thead>'+
          '<tr>'+
            '<th>ipv4({{$ctrl.dnsList.public.length}})</th>'+
            '<th><button ng-click="$ctrl.dnsList.onWhois()">whois</button></th>'+
          '</tr>'+
        '</thead>'+
        '<tbody>'+
        '<tr ng-repeat="record in $ctrl.dnsList.public">'+
            '<td>{{record.ip}}</td>'+
            '<td><table><tr ng-repeat="detail in record.detail"><td>{{detail.netname}}</td><td>{{detail.netblock}}</td></tr><table></td>'+
        '</tbody>'+
      '</table>'+
    '</div>',
    controller : function publicRecordsController(){
        var ctrl = this;
    }
})
*/