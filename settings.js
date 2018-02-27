module.exports = {
    timeout : {
        dns : 10000,
        ssl : 10000,
        web : 10000
    },

    nmap : {
        rate : 2000,
        concurrence : 1
    },
    
    db :{
        type : "mongodb",

        elasticsearch : {
            host : "127.0.0.1",
            port : "9200"
        },

        mongodb : {
            uri : "mongodb://127.0.0.1:27017/vector"
        }
    }
}