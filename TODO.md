# TODO
## dash面板常用查询整合：
    top100域名
    top100端口
    top100服务
    top100web服务等

## 指纹与端口实现
    pbscan插件整合
    grab.js端口，主机端口指纹识别实现
    nmap指纹识别实现（nmap-service,nmap-service-payload）

## 端口攻击插件框架设计与实现

# daily
## 2018-1-4
    express查询接口
    数据库访问代码修改
    task，dnsrecord，service查询接口
    
## 2018-1-5
    banner查询接口
    完成express对应查询接口
    get实现转post实现 

    x-www-form-urlencoded解析 
    app.use(bodyParser.urlencoded({ extended: true })); 
    
    incoming request json解析 
    app.use(require('body-parser).json())
    app.get('/', function(req, res){
        var jsonBody = req.body;
    })
    outgoing response json解析
    res.status(200).json({}).end()

    添加middleware 强制所有请求必须为json


    pbscan https://github.com/gvb84/pbscan
    依赖项
        netmap
        libuinet: 一个用户级的freedbs协议栈
        https://www.bsdcan.org/2014/schedule/attachments/260_libuinet_bsdcan2014.pdf

    编译问题：
        https://github.com/pkelsey/libuinet/pull/37/commits/88be9c0dcef12a91dcfddf42cfbbe6a458992307
        centos7，debian9编译通过

## 2018-1-7
banner定义与入库

##2018-1-8
banner定义，
elasticsearch中mutil field定义
同一个字段，以不同的索引方式来存储，
    索引为text类型用于全文检索
    索引为keyword类型用于排序与聚合

    "domain" :{
        "type" : "text",
        "fields" :{
            "raw" : {
                "type" : "keyword",
                "analyzer" : "english" //可为相同字段下不用的索引方式指定分析器
            }
        }
    }

banner定义
angularjs界面

## 2018-1-9
elasticsearch modeling your data

banner识别序列化执行
入库&查询基本完成
    exist查询


## 2018-1-10
*grab.js识别实现以及性能测试
*分析masscan 指纹识别实现

## 2018-1-11
*扫描带宽配置：扫描器流量配置以及出口流量比例配置

## 2018-1-13
dns并行解析策略修改，根据目标ns服务器数量来控制并行解析请求
并在结果中展现，目标dns对域名的解析成功率
在超时请求占比高的情况下，丢弃解析率底的权威dns。

domainscantask添加自定义dns字段

## 2018-1-14
## 2018-1-15
## 2018-1-16
js,原型链，继承
plugins原型设计

angularjs静态代码分析逆向工具
https://github.com/mgechev/ngrev
数据库选择
https://www.mongodb.com/compare/mongodb-postgresql?jmp=cpress&utm_campaign=WW_CP_newsletter_sponsorship_FY19Q1&utm_content=sponsored&utm_medium=display&utm_source=javascriptweekly&utm_date=20180112

二进制payload抓取工具
tcpdump保存pcap文件，nodejs脚本解析得到二进制payload，JAVARMI为例子

## 2018-1-17
whois 网段以及网络名信息els查询整合
*netname(netblock)
    *ip
    *ip
    *ip

## 2018-1-18
angular-tree-control集成
whois信息展现

*service入库之前检查ip是否存在，避免重复的banner识别任务
els不具备实时一致性，dns扫描任务结束后，在dnsrecord索引上执行聚合查询，过滤出单一的ip地址，在批量导入services索引执行全端口扫描

## 2018-1-19
getHostsOnNetblock 联合查询dnsrecord索引，获取ip对应的域名记录
whois信息重复问题，bulkinsert之后，用过调度执行查询


## 2018-1-23
    TODO：基于whois索引下detail字段的查询，存在重复的问题（detail字段中有多个解析结果导致的）
    TODO：whois查询重定向与解析问题
    TODO：whois查询结果中存在多个网络名

    whois 信息入库之前，根据detail数组，创建一条join字段，可以用来唯一标示netblock。
    "aggregations" : {
        "hosts" : {
        "doc_count_error_upper_bound" : 0,
        "sum_other_doc_count" : 0,
        "buckets" : [
            {
            "key" : "KORNET^KORNET-KR",
            "doc_count" : 37
            },
            {
            "key" : "broadNnet^broadNnet-KR",
            "doc_count" : 8
            },
            {
            "key" : "SHINBIRO^SHINBIRO-KR",
            "doc_count" : 3
            }
        ]
        }
    }

    基于该搜索结果，来构建树结构，再末级节点，允许netname－->netblock的查询

    DNSScanResult消息，转发到whois与service进程进行处理。

    ssl功能整合，
    

## 2018-01-24
    dashboard高防节点与无开放端口的主机
    TODO:whois信息合并，后续添加节点合并的拖拽操作

## 2018-1-25
    指纹识别流程：
    主动端口／被动端口类型识别
    ssl识别
    http服务识别

    剩下的未知服务提交到nmap进行扫描

    高防节点存储到独立的索引

    mongodb引入？elasticsearch真的太费劲了
    
## 2018-1-26
    ssl识别，comm识别，nmap任务调度流程

    dns -> services -> ssl -> web -> nmap


    dns done ->

    services one by one ->
        ssl scanner -> 批量扫描，结果存储ssl index

    ssl done ->
        web scanner -> 批量扫描，识别http服务，结果存储http index
                    -> 未知的ip & port pair 存储nmaptask中
                    
        由nmap执行调度

## 2018-02-06
端口扫描完毕，在banner索引下，创建taskid，ip，port为唯一索引的banner记录
由一个统一的调度器负责从banner中调度尚未完成的任务，通过zmq＋protocolbuf的形式分发到各个扫描进程
    step 1.ssl
    step 2.web
    step 3.nmap banner

    ssl，web等仅做简单的扫描与识别，为了减轻nmap扫描的负担，以及nmap对web识别的误报。
    没有在ssl与web中加入过于复杂的识别代码。


mixtask 支持，自定义ip与域名（由223.5.5.5解析）

！！dashboard下的service索引，手工导入banner库进行扫描，开发与xx任务同步完成

服务视图（扫描完毕后可见）
域名视图
whois视图

## 2018-02-07
    bug: 无权威dns服务器，构造queue异常
    bug: webpage处理https时的bug
    TODO:whois请求队列化处理

## 2018-02-08

# JavaScript
    https://molily.de/robust-javascript/#characteristics-of-javascript
    
# NodeJS
    进程管理

# Express
    handler基本用法

# ZMQ
    基本的通信模型：req-rep，push-pull，pub-sub，dealer-router

# ProtocolBuffer
    基本用法

# Elasticsearch
    数据类型：

    mapping定义：
        字段多类型
        
    查询：
        排序：sort
        分页：from&size，scroll

# MongoDB
# SQLite