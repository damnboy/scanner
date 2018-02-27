module.exports = {
    timeout : {
        dns : 5000,
        ssl : 5000,
        web : 5000
    },

    nmap : {
        rate : 500,
        concurrence : 1
    },
    
    db :{
        type : "mongodb",

        elasticsearch : {
            host : "218.85.154.137",
            port : "9200"
        },

        mongodb : {
            uri : "mongodb://10.211.55.13:27017/vector"
        }
    }
}