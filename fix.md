# 2018-03-12
无配置主键所导致的问题
Mix类型任务没有将域名解析后的ip地址，与提交扫描的ip地址进行合并处理，导致services集合下出现taskId与ip重复的记录
```js
> db.services.find({"ip":"223.220.254.183"})
{ "_id" : ObjectId("5aa5f3a3146dbc7e28fe19dc"), "createDate" : 1520825251164, "done" : true, "ip" : "223.220.254.183", "taskId" : "45a76530-25a5-11e8-843e-a7a60dfa96d7", "scannedDate" : 1520838088475, "tcp" : [ 80, 10001 ] }
{ "_id" : ObjectId("5aa5f3a3146dbc7e28fe19e2"), "createDate" : 1520825251164, "done" : false, "ip" : "223.220.254.183", "taskId" : "45a76530-25a5-11e8-843e-a7a60dfa96d7" }
```

dbapi接口集中的doneNmaptask根据taskId与ip来确定唯一的nmap扫描任务，并用updateOne进行更新处理，会导致另一条重复记录始终无法被更新。
调度方法不断执行针对223.220.254.183的端口扫描，使得banners集合下出现大量针对223.220.254.183端口成都重复记录
```
> db.banners.count({"ip":"223.220.254.183"})
104
```
dbapi接口集中的doneScheduledServiceBannerTask同样存在此问题

## fix
将dbapi接口集中的scheduleNmapServiceTasks移动到domain.js中执行，将域名解析后的ip地址，以及提交扫描的ip地址合并之后，再进行入库处理
将dbapi接口集中的doneNmaptask，doneScheduledServiceBannerTask中的updateOne替换为updateMany
