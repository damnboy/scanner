'use strict';

// Register `phoneDetail` component, along with its associated controller and template
angular.
  module('phoneDetail').
  component('phoneDetail', {
    templateUrl: 'phone-detail/phone-detail.template.html',
    controller: ['$routeParams', '$http',
      function PhoneDetailController($routeParams, $http) {
        var self = this;
        this.taskId = $routeParams.phoneId;
        this.onlineHosts = [];
        this.offlineHosts = [];
        this.cloudHosts = [];
        
        $http.get('/hosts/'+$routeParams.phoneId).then(function(response) {
          response.data.data.forEach(function(host){
            if(host.tcp.length === 0){
              self.offlineHosts.push(host)
            }

            if(host.tcp.length > 50){
              self.cloudHosts.push(host);
            }

            if(host.tcp.length < 50 && host.tcp.length > 0){
              self.onlineHosts.push(host);
            }

          });
        });
      }
    ]
  });
