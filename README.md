# 说明
前期踩点常用toolkits，功能陆续添加中 :)

## 模块

### 扫描任务 (./daemin/task.js)

域名任务
混合任务（ip＋域名）

TODO 

c段任务
特定端口任务

### 子域名爆破 (./daemon/domain.js)

TODO

超时问题
无权威dns服务器可用时的bug

### 全端口扫描 (./daemon/service.js)

依赖nmap -p-实现

TODO 

masscan，zmap整合

### whois (./daemon/whois.js)

TODO

重新整理whois信息的格式，用于还原目标网络名称的树型结构

BUG
超时的whois请求会导致后续的任务被丢弃

### 服务指纹收集
ssl -> web -> nmap

TODO

调度方式流程优化
现有的调度方式存在的bug(schedule内部并发n个setTimeout，指数级递增)
调用引用mongodb queue完成

#### ssl (./daemon/banner/ssl/index.js)

#### web (./daemon/banner/web/index.js)

#### nmap (./daemon/banner/nmap/index.js)

### 基于指纹的插件化，信息收集及攻击框架(./plugins)

### geo dashboard

TODO

地图，ip位置坐标整合

### dashboard

TODO

海量信息统计
历史扫描信息差异对比


# 依赖

## Nmap 7.60
https://nmap.org/dist/nmap-7.60.tar.bz2

## zeromq
sudo yum install -y epel-release

sudo yum install -y zeromq-devel

## mongodb 3.6.2
https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-3.6.3.tgz
 




# 安装&运行
下载以上依赖后，执行npm install & node ./deamon local


# TODO

### message queue
一个比较nice的轻量级调度算法或
一个轻量级的消息队列，用于从mongodb中获取任务，执行分发调度。
替换目前banner以及全端口扫描任务中的垃圾代码。
参考gryffin中的实现

参考实现 
https://github.com/chilts/mongodb-queue
https://stackoverflow.com/questions/9274777/mongodb-as-a-queue-service

# remark
http://www.alolo.co/blog/2013/10/11/10-books-on-javascript
