/*
http://java.globinch.com/enterprise-java/web-services/soap-binding-document-rpc-style-web-services-difference/



参数构造
打印client结构，参考其中的input属性来构造调用参数
console.log(require('util').inspect(client.describe(), true, 10));

对于没有参数的接口，直接传递null


参数缺失，参数错误导致的报错

org.xml.sax.SAXException: operation description is missing parameter description!<
http://www.soapclient.com/soaptest.html

Unhandled rejection AssertionError: invalid message definition for rpc style binding
https://stackoverflow.com/questions/22021944/node-js-soap-invalid-message-definition-for-rpc-style-binding
I was suffering with this for a while - I had success by defining args as 'null':


*/
var soap = require('soap'); //https://github.com/vpulim/node-soap
var WebPage = require('../libs/http/page');
var cheerio = require('cheerio');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

function SoapClient(){
  EventEmitter.call(this);
}

util.inherits(SoapClient, EventEmitter);

SoapClient.prototype.describe = function(url){
  var self = this;
  return soap.createClientAsync(url)
  .then(function(client){
    self.inspect(client.describe(), 0, 2);
    return client;
  })
};

SoapClient.prototype.inspect = function(o, depth, level){
  var self = this;
  Object.keys(o).forEach(function(key){
    if(depth === level){
      self.emit('method', key, o[key].input, o[key].output);
    }

    if(typeof(o[key]) === 'object'){
      self.inspect(o[key], depth + 1, level);
    }
  });
};

function AxisClient(){

}

AxisClient.prototype.describe = function(url){
  var soapClient = new SoapClient();
  
  var page = new WebPage();
  return page.request(url)
  .then(function(response){
    var $ = cheerio.load(response.body);
    var interfaces = $('li');
    interfaces.each(function(){
      var e = $(this);
      console.log(e.text());
      e.children().each(function(i, ee){
        if(ee.tagName === 'a'){
          var href = $(this).attr('href');
          soapClient.describe(href);
        }
      });
    });
  })
  .catch(function(err){
    console.log(err);
  });
};

var client = new SoapClient();

client.on('method', function(name, input, output){
  console.log(name, input);
});

client.describe('http://115.168.76.212:18080/services/OSS_PortalEngine?wsdl')
.then(function(client){
  return client.getSubscriptionAsync(
    { 
      srcDeviceID: '0',
      srcDeviceType:1,
      streamingNo: 'xxxxs',
      userID: '0000',
      userIDType: 1,
    });
})
.then(function(result){
  console.log(result);
})
.catch(function(error){
  console.log(error);
});

