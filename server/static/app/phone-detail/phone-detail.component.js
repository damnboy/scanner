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
        this.banners = []
        this.page = 0;
        this.size = 20;
        this.more = true;

        this.onPrevPage = function(){
          if(self.page === 1){
            return;
          }
          
          var offset = (self.page - 2)* self.size;
          $http.get('/dnsrecord/'+$routeParams.phoneId + '/' + offset).then(function(response) {
            self.phones = response.data.data;
            if(self.phones.length > 0){
              self.more = true
            }
            self.page = self.page - 1;
          });
        }

        this.onNextPage = function(){
          if(self.more){
            var offset = (self.page) * self.size;
            $http.get('/dnsrecord/'+$routeParams.phoneId + '/' + offset).then(function(response) {
              self.phones = response.data.data;
              if(self.phones.length < 20){
                self.more = false;
              }
              self.page = self.page + 1
            });
          }

        }

        this.onHostDetail = function(ip){
          $http.post('/service/detail/',{
            'task_id' : $routeParams.phoneId,
            'ip' : ip
          })
          .then(function(response){
            self.banners = response.data.data;
          })
        }

        this.onNextPage()
      }
    ]
  });
