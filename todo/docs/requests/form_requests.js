/*
upload type

    application/x-www-form-urlencoded(URL-Encoded Forms)

    multipart/form-data
        该部分引用了form-data(@felixge)  https://github.com/form-data/form-data
        更相信的操作，可以参考form-data的github中的README

    multipart/related
*/

/*
multipart/form-data
    form-data的用法 

    var form = new FormData()


    var request = form.submit('url);
     
    or

    form.submit('url', function(err, response){
        
    })


    var r = request.post
    var form = r.form()
*/


var request = require('request');
var fs = require('fs');
var path = require('path')

function upload_test(url, cookie, file){
    return new Promise(function(resolve, reject){
        var r = request.post({
            'url': url,
            'proxy' : 'http://192.168.180.140:8080',
            'headers' : {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:45.0) Gecko/20100101 Firefox/45.0',
                'Cookie': cookie
            }}, function(err, response, body){
                if(err){
                    console.log(err);
                    reject(err)
                }
                else if(response.statusCode >= 500){
                    reject(response.body)
                }
                else{
                    resolve(response)
                }
            });

        var form = r.form();

        form.append('ID', '23')
        form.append('findBusinessId', '901200001')
        form.append('secondBusinessId', '1')
        form.append('loginBefore_time', '0')
        form.append('loginBeforeAd(1)', fs.createReadStream(file), {filename : path.basename(file)})
    })

}

function upload(url, cookie, buildFormData){
    return new Promise(function(resolve, reject){
        var r = request.post({
            'formData' : buildFormData(),
            'url': url,
            'proxy' : 'http://192.168.180.140:8080',
            'headers' : {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:45.0) Gecko/20100101 Firefox/45.0',
                'Cookie': cookie
            }}, function(err, response, body){
                if(err){
                    console.log(err);
                    reject(err)
                }
                else if(response.statusCode >= 500){
                    reject(response.body)
                }
                else{
                    resolve(response)
                }
            });
    })
}

//url 
//cookie 
upload('http://172.168.68.249:18001/jsp/adImageManage/adImageAction.do?command=6', 'JSESSIONID=12111695C0A258567B4DB7AA8A77D9CF', function buildFormData(){
    return {
        'ID': '23',
        'findBusinessId': '901200001',
        'secondBusinessId': '1',
        'loginBefore_time': '0',
        'loginBeforeAd(1)' :{
            value : fs.createReadStream('/etc/passwd'),
            options : {
                filename : 'passwd1'
            }
        }
    }
})
.then(function(response){
    console.log(response.statusCode)
})
.catch(function(err){
    console.log(err)
})


