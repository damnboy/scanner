'use strict';

// Register `phoneDetail` component, along with its associated controller and template
angular.
  module('hostDetail').
  component('hostDetail', {
    templateUrl: 'host-detail/host-detail.template.html',
    controller: ['$routeParams', '$http',
      function HostDetailController($routeParams, $http) {
        var self = this;
        this.banners;

        //this.onHostDetail = function(ip){
          var data = {
            'task_id' : $routeParams.phoneId,
            'ip' : $routeParams.ip
          }
          $http.post('/service/detail/',data)
          .then(function(response){
            self.banners = response.data.data;
          })
        //}
      }
    ]
  });
