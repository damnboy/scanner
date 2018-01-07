#JavaScript
    
#NodeJS
    进程管理

#Express
    handler基本用法

#ZMQ
    基本的通信模型：req-rep，push-pull，pub-sub，dealer-router

#ProtocolBuffer
    基本用法

#Elasticsearch
    数据类型，
    mapping定义，
    查询：
        排序：sort
        分页：from&size，scroll

#MongoDB
#SQLite



2018-1-4
    express查询接口
    数据库访问代码修改
    task，dnsrecord，service查询接口
    
2018-1-5
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
    