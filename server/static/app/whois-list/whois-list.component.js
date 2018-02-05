'use strict';

// Register `phoneDetail` component, along with its associated controller and template
angular.
  module('whoisList').
  component('whoisList', {
    templateUrl: 'whois-list/whois-list.template.html',
    controller: ['$routeParams', '$http',
      function WhoisListController($routeParams, $http) {
        this.treeOptions = {
            nodeChildren: "children",
            dirSelectable: true,
            injectClasses: {
                ul: "a1",
                li: "a2",
                liSelected: "a7",
                iExpanded: "a3",
                iCollapsed: "a4",
                iLeaf: "a5",
                label: "a6",
                labelSelected: "a8"
            }
        }
        this.dataForTheTree =
        [

        ];

        this.newNode = (function(){
          var id = 0;
          return function(){
            id = id + 1;
            return {"name" : id }
          }
        })();

        this.showSelected = function(node, selected){
          console.log(node, selected)
        }
        this.showToggle = function(node, expanded){
          if(node.type === "netname"){
            $http.get('/whois/netblocks/' + $routeParams.taskId + '/' + node.displayName).then(function(response) {
              node.children = response.data.data.map(function(i){
                var node = self.newNode();
                node.displayName = i.ip;
                node.count = i.count;
                node.type = "ip";
                node.children = [{"name":""}];
                return node;
              })
            });
          }

          if(node.type === "netblock"){
            $http.get('/whois/hosts/' + $routeParams.taskId + '/' + node.displayName).then(function(response) {
              node.children = response.data.data.map(function(i){
                return {"name" :i.ip,  "count" :i.count, "type":"ip", "children" : [{"name":""}]}
              })
            });
          }

          if(node.type === "ip"){
            //dnsrecord/virtualHost/a8db5560-fc71-11e7-b457-45b900efcb68/113.108.216.239/25
            $http.get('/dnsrecord/virtualHost/' + $routeParams.taskId + '/' + node.displayName + '/' + node.count).then(function(response) {
              node.children = response.data.data.map(function(i){
                var node = self.newNode();
                node.displayName = i.domain;
                node.count = i.count;
                node.type = "domain";
                node.children = [];
                return node;
              })
            });
          }
        }
        var self = this;

        
        $http.get('/whois/' + $routeParams.taskId).then(function(response) {

          self.o = {name : "root", children: []};
          response.data.data.forEach(function(elem){
              var levels = elem.joinedNetnames.split('^');
              levels.reduce(function(next, key, i){
                  var r = next.children.filter(function(ch){
                      return ch.displayName === key;
                  })
                  
                  if(r.length === 0){
                    var node = self.newNode();
                    node.displayName = key;
                    node.count = elem.count;
                    node.children = [];
                    if(i === levels.length - 1){
                      node.type = 'netname';
                      node.children.push({"name" : ""});
                    }
                    next.children.push(node);
                  }
                  
                  return next.children.filter(function(ch){
                      return ch.displayName === key;
                  })[0]
              }, self.o);
          })

          self.dataForTheTree = self.o.children;
          /*
          self.dataForTheTree = response.data.data.map(function(i){
            return {"name" :i.key.split('^')[0], "count":i.doc_count, "type":"netname", "children" : [{"name":""}]}
          })
          */
          
        });
      }
    ]
  });
