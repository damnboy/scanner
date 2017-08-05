var sheet = require('xlsx');
var util = require('util');
var events = require('events');

function ExcelReader() {//新建一个类
    events.EventEmitter.call(this);
}

util.inherits(ExcelReader, events.EventEmitter);//使这个类继承EventEmitter

ExcelReader.prototype.readFile = function(filename){
    var _self = this;
    var p = sheet.readFile(filename, {});
    p.SheetNames.forEach(function(name){
        var sheetRouter = new events.EventEmitter();
        _self.emit(name, sheetRouter);
        //_self.emit('sheet', name);
        /*
            两种类型对象
            cell addess {c,r}
            cell range {s,e}
            !margins
            !merges
            [e{0,10},s{0,1}]
            [e{0,23},s{0,11}]合并单元格的范围，range对象
            !ref
            A1:L24
        */
        var sheet = p.Sheets[name];
        if(sheet['!ref']){
            var edge = {
                'horizontal' : {
                    'start' : sheet['!ref'].split(':')[0].substring(0,1),
                    'end' : sheet['!ref'].split(':')[1].substring(0,1)
                },
                'vertical' : {
                    'start' : sheet['!ref'].split(':')[0].substring(1),
                    'end': sheet['!ref'].split(':')[1].substring(1)
                }
            };

            for(var row_index = parseInt(edge['vertical']['start']); row_index <= parseInt(edge['vertical']['end']); row_index++){
                var row = {};
                for(var col_index = edge['horizontal']['start'].charCodeAt(); col_index <= edge['horizontal']['end'].charCodeAt(); col_index++){
                    var localtion = util.format('%s%d', String.fromCharCode(col_index), row_index);
                    sheetRouter.emit('cell', localtion, sheet[localtion]);
                    row[localtion] = sheet[localtion];
                }
                sheetRouter.emit('row', row_index, row);
            }
            
        }
    });
};

/*
function ExcelFile(){
    events.EventEmitter.call(this);
}

util.inherits(ExcelFile, events.EventEmitter);

ExcelFile.prototype.parse = function(filename, sheetname, sheetProcess){
    var _self = this;
    var excel = new ExcelReader();
    excel.on(sheetname, sheetProcess);
    excel.readFile(filename);
}
*/
module.exports = ExcelReader
//module.exports = ExcelReader;
