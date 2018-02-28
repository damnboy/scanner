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

中心整理whois信息的格式，用于还原目标网络名称的树型结构

### 服务指纹收集
ssl -> web -> nmap

TODO

流程优化
现有的调度方式存在的bug

#### ssl (./daemon/banner/ssl/index.js)

#### web (./daemon/banner/web/index.js)

#### nmap (./daemon/banner/nmap/index.js)


### dashboard


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


# remark
http://www.alolo.co/blog/2013/10/11/10-books-on-javascript
