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