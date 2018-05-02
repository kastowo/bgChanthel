var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var yamlconfig = require('yaml-config');
var configYaml = yamlconfig.readConfig('../config/config.yml');
var http = require('http');
var host = configYaml.hive.host;
var port = configYaml.hive.port;
var request = require('request');
// var protocol = 'http';
// var alamat = '192.168.1.199';
// var ports = 50111;
// var pathname = 'templeton/v1/ddl/database';
// var ddl = protocol+'://'+alamat+':'+ports+'/'+pathname;
// var hive = protocol+'://'+alamat+':'+ports+'/templeton/v1/hive';
var querystring = require('querystring');

var Database = require("../mysql/Mysql.js");
var Api_cluster = Database('Cluster');
var Api_user = Database('User');
var Api_config = Database('Config');


//setting midleware
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "key, origin, content-type, accept");
    res.header("Access-Control-Allow-Methods", "DELETE, GET, POST, PUT, OPTIONS");
//  res.removeHeader("x-powered-by");
    next();
});


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// parse application/json
app.use(bodyParser.json())

var Hive = {
    get: {
        listDbTb: function getAllList(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var username = req.query.username;

            //check ip dengan header
            if (typeof ipAddresHeader !== 'undefined') {
                ipAddres = ipAddresHeader;
            }
            checkApikey(apikey, ipAddres, function (result) {
                if (result.err_code == 0) {
                    getUserByApikey(apikey, function (result2) {
                        if (result2.err_code == 0) {
                            //ambil cluster_id
                            var cluster_id = result2.user_cluster_id;
                            var user_id = result2.user_id;

                            Api_cluster.findJoin({"cluster_id": cluster_id}, {Config: "config_cluster_id"}, function (err, data) {
                                if (err) {
                                    res.json(err);
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        var projectName = data[0].Configs[0].config_value;
                                        var usernameOozie, nameNode, jobTracker, queueName, useSystemLibpath,
                                            oozieLibpath;
                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "hivecluster") {
                                                hiveHostname = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "hive_port") {
                                                hivePort = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (hiveHostname != null && hivePort != null) {

                                            if (username != null) {
                                                var basepath = 'templeton/v1/ddl/database';
                                                var opt = hiveHostname + ':' + hivePort + '/' + basepath;
                                                var obj = opt + '?user.name=' + username;
                                                var options = {
                                                    uri: obj,
                                                    method: 'GET'
                                                }

                                                request(options, function (error, response, body) {
                                                    if (error) {
                                                       console.log(error);
                                                       res.json({
                                                           "err_code": 500,
                                                           "err_msg": "Internal error. See console log for more details"
                                                       });
                                                    } else {

                                                        var jsonData = JSON.parse(body);
                                                        var xx = [];
                                                        var completed_requests = 0;

                                                        for (var i = 0; i < jsonData.databases.length; i++) {
                                                            var dbname = jsonData.databases[i];

                                                            var obj2 = opt + '/' + dbname + '/table?user.name=' + username;
                                                            http.get(obj2, function(res2) {
                                                                completed_requests++;
                                                                res2.setEncoding('utf8');
                                                                res2.on('data', function(chunk){
                                                                    data = JSON.parse(chunk);
                                                                    xx.push(data);
                                                                    if (completed_requests == jsonData.databases.length) {
                                                                        // All download done, process responses array
                                                                        res.json({
                                                                            "err_code": 200,
                                                                            "status": "OK",
                                                                            "data": xx
                                                                        });
                                                                    }
                                                                });
                                                                console.log(xx);

                                                            });

                                                        }
                                                    }

                                                });
                                            } else {
                                                res.json({"err_code": 500, "err_msg": "username is empty"});
                                            }
                                        } else {
                                            res.json({
                                                "err_code": 500,
                                                "err_msg": "Configuration cluster for hive is not found"
                                            });
                                        }
                                    } else {
                                        res.json({
                                            "err_code": 2,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                        console.log("Cluster Configuration is not found or user cluster is not set");
                                    }
                                }
                            })
                        } else {
                            result2.err_code == 500;
                            res.json(result);
                        }
                    });
                } else {
                    result.err_code = 500;
                    res.json(result);
                }
            });
        },
        listDatabase: function getListDatabase(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var username = req.query.username;

            //check ip dengan header
            if (typeof ipAddresHeader !== 'undefined') {
                ipAddres = ipAddresHeader;
            }

            checkApikey(apikey, ipAddres, function (result) {
                if (result.err_code == 0) {
                    getUserByApikey(apikey, function (result2) {
                        if (result2.err_code == 0) {
                            //ambil cluster_id
                            var cluster_id = result2.user_cluster_id;
                            var user_id = result2.user_id;

                            Api_cluster.findJoin({"cluster_id": cluster_id}, {Config: "config_cluster_id"}, function (err, data) {
                                if (err) {
                                    res.json(err);
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        var projectName = data[0].Configs[0].config_value;
                                        var usernameOozie, nameNode, jobTracker, queueName, useSystemLibpath,
                                            oozieLibpath;
                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "hivecluster") {
                                                hiveHostname = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "hive_port") {
                                                hivePort = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (hiveHostname != null && hivePort != null) {

                                            if (username != null) {
                                                var pathname = 'templeton/v1/ddl/database';
                                                var opt = hiveHostname + ':' + hivePort + '/' + pathname;
                                                var obj = opt + '?user.name=' + username;
                                                request(obj,
                                                    {json: true},
                                                    (err, response, body) => {
                                                    if(err) {
                                                        res.json(err);
                                                        console.log(err);
                                                    } else {
                                                        if(response.statusCode == 200)
                                                        {
                                                            res.json({"err_code": 0, "data": body});
                                                        }
                                                        else
                                                        {
                                                            res.json({"err_code": 500, "err_msg": body});
                                                        }
                                                    }
                                                });
                                            } else {
                                                res.json({"err_code": 500, "err_msg": "username is empty"});
                                            }
                                        } else {
                                            res.json({
                                                "err_code": 500,
                                                "err_msg": "Configuration cluster for hive is not found"
                                            });
                                        }
                                    } else {
                                        res.json({
                                            "err_code": 2,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                        console.log("Cluster Configuration is not found or user cluster is not set");
                                    }
                                }
                            })
                        } else {
                            result2.err_code == 500;
                            res.json(result);
                        }
                    });
                } else {
                    result.err_code = 500;
                    res.json(result);
                }
            });
        },
        listTables: function getListTables(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var dbname = req.query.dbname;
            var username = req.query.username;

            //check ip dengan header
            if (typeof ipAddresHeader !== 'undefined') {
                ipAddres = ipAddresHeader;
            }

            checkApikey(apikey, ipAddres, function (result) {
                if (result.err_code == 0) {
                    getUserByApikey(apikey, function (result2) {
                        if (result2.err_code == 0) {
                            //ambil cluster_id
                            var cluster_id = result2.user_cluster_id;
                            var user_id = result2.user_id;

                            Api_cluster.findJoin({"cluster_id": cluster_id}, {Config: "config_cluster_id"}, function (err, data) {
                                if (err) {
                                    res.json(err);
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        //mengambil konfigurasi cluster
                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "hivecluster") {
                                                hiveHostname = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "hive_port") {
                                                hivePort = job_config[0].Configs[i].config_value;
                                            }
                                        }
                                        if (hivePort != null && hiveHostname != null) {
                                            if (dbname != null) {
                                                if (username != null) {
                                                    var pathname = 'templeton/v1/ddl/database';
                                                    var ddl = hiveHostname + ':' + hivePort + '/' + pathname;
                                                    var obj = ddl + '/' + dbname + '/table?user.name=' + username;
                                                    request(obj,
                                                        {json: true},
                                                        (err, response, body) => {
                                                        if(err) {
                                                            res.json(err)
                                                            console.log(err);
                                                        } else {
                                                            if(response.statusCode == 200)
                                                            {
                                                                res.json({"err_code": 0, "data": body});
                                                            }
                                                            else
                                                            {
                                                                res.json({"err_code": response.statusCode, "err_msg": body});
                                                            }
                                                        }
                                                    });

                                                } else {
                                                    res.json({"err_code": 500, "err_msg": "username is empty"})
                                                }
                                            } else {
                                                res.json({"err_code": 500, "err_msg": "database name is empty"})
                                            }
                                        } else {
                                            res.json({
                                                "err_code": 500,
                                                "err_msg": "Cluster configuration for hive is not found"
                                            })
                                        }
                                    } else {
                                        res.json({
                                            "err_code": 2,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                    }
                                }
                            });
                        } else {
                            result2.err_code == 500;
                            res.json(result);
                        }
                    });

                } else {
                    result.err_code = 500;
                    res.json(result);
                }
            });


        },
        describeTable: function getDescribeTable(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var username = req.query.username;
            var dbname = req.query.dbname;
            var tbname = req.query.tbname;

            //check ip dengan header
            if (typeof ipAddresHeader !== 'undefined') {
                ipAddres = ipAddresHeader;
            }

            checkApikey(apikey, ipAddres, function (result) {
                if (result.err_code == 0) {
                    getUserByApikey(apikey, function (result2) {
                        if (result2.err_code == 0) {
                            //ambil cluster_id
                            var cluster_id = result2.user_cluster_id;
                            var user_id = result2.user_id;

                            Api_cluster.findJoin({"cluster_id": cluster_id}, {Config: "config_cluster_id"}, function (err, data) {
                                if (err) {
                                    res.json(err);
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        //mengambil konfigurasi cluster
                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "hivecluster") {
                                                hiveHostname = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "hive_port") {
                                                hivePort = job_config[0].Configs[i].config_value;
                                            }
                                        }
                                        // fungsinya disini
                                        if (username != null) {
                                            if (dbname != null) {
                                                if (tbname != null) {
                                                    if (hivePort != null && hiveHostname != null) {
                                                        var pathname = 'templeton/v1/ddl/database';
                                                        var ddl = hiveHostname + ':' + hivePort + '/' + pathname;
                                                        var obj = ddl + '/' + dbname + '/table/' + tbname + "?user.name=" + username + '&format=extended';
                                                        var options = {
                                                            uri: obj,
                                                            method: 'GET'
                                                        }

                                                        request(options, function (error, response, body) {
                                                            if (error) {
                                                                res.json(error);
                                                            } else if (response.statusCode == 200) {
                                                                console.log(body);
                                                                a = JSON.parse(body);
                                                                if (typeof a.sd.serdeInfo.parameters['field.delim'] != 'undefined') {
                                                                    res.json({
                                                                        "err_code": 0,
                                                                        "data": [{
                                                                            "columns": a.columns
                                                                        }, {
                                                                            "database": a.database
                                                                        }, {
                                                                            "table": a.table
                                                                        }],
                                                                        "delimiter": a.sd.serdeInfo.parameters['field.delim']
                                                                    });
                                                                } else {
                                                                    res.json({
                                                                        "err_code": 0,
                                                                        "data": [{
                                                                            "columns": a.columns
                                                                        }, {
                                                                            "database": a.database
                                                                        }, {
                                                                            "table": a.table
                                                                        }],
                                                                        "delimiter": ""
                                                                    });
                                                                }

                                                            } else if (response.statusCode != 200 && response.statusCode == 404) {
                                                                a = JSON.parse(body);
                                                                res.json({
                                                                    "err_code": response.statusCode,
                                                                    "err_msg": a
                                                                });
                                                            } else if (response.statusCode != 200) {
                                                                res.json({
                                                                    "err_code": response.statusCode,
                                                                    "err_msg": response
                                                                });
                                                            } else {
                                                                if (error != null) {
                                                                    res.json(error);
                                                                } else {
                                                                    res.json({
                                                                        "err_code": 500,
                                                                        "err_msg": "Undefined Error"
                                                                    });
                                                                }
                                                            }
                                                        });
                                                    } else {
                                                        res.json({
                                                            "err_code": 500,
                                                            "err_msg": "Cluster configuration for hive not found"
                                                        });
                                                    }
                                                } else {
                                                    res.json({"err_code": 500, "err_msg": "table name is empty"})
                                                }
                                            } else {
                                                res.json({"err_code": 500, "err_msg": "database name is empty"})
                                            }
                                        } else {
                                            res.json({"err_code": 500, "err_msg": "username is empty"})
                                        }
                                    } else {
                                        res.json({
                                            "err_code": 2,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });

                                    }
                                }
                            })
                        } else {
                            result2.err_code == 500;
                            res.json(result);
                        }
                    });
                } else {
                    result.err_code = 500;
                    res.json(result);
                }
            });
        }
    },
    post: {
        createQuery: function makeQuery(req, res) {
            if (Object.keys(req.body).length) {
                var ipAddres = req.connection.remoteAddress;
                var apikey = req.params.apikey;
                var ipAddresHeader = req.headers.api;
                var username = req.body.username;
                var execute = req.body.execute;
                var statusdir = req.body.statusdir;

                //check ip dengan header
                if (typeof ipAddresHeader !== 'undefined') {
                    ipAddres = ipAddresHeader;
                }

                checkApikey(apikey, ipAddres, function (result) {
                    if (result.err_code == 0) {
                        getUserByApikey(apikey, function (result2) {
                            if (result2.err_code == 0) {
                                //ambil cluster_id
                                var cluster_id = result2.user_cluster_id;
                                var user_id = result2.user_id;

                                Api_cluster.findJoin({"cluster_id": cluster_id}, {Config: "config_cluster_id"}, function (err, data) {
                                    if (err) {
                                        res.json(err);
                                    } else {
                                        var job_config = data;
                                        if (job_config.length > 0) {

                                            for (var i = 0; i < job_config[0].Configs.length; i++) {
                                                if (job_config[0].Configs[i].config_key == "hivecluster") {
                                                    hiveHostname = job_config[0].Configs[i].config_value;
                                                }
                                                if (job_config[0].Configs[i].config_key == "hive_port") {
                                                    hivePort = job_config[0].Configs[i].config_value;
                                                }
                                            }

                                            if (username != null) {
                                                if (statusdir != null) {
                                                    //http://192.168.1.199:50111/templeton/v1/hive?user.name=hdfs
                                                    var hive = hiveHostname + ':' + hivePort + '/templeton/v1/hive';
                                                    var obj = hive + '?user.name=' + username;
                                                    var form = {
                                                        execute: execute,
                                                        statusdir: statusdir
                                                    };

                                                    var formData = querystring.stringify(form);
                                                    var contentLength = formData.length;
                                                    request({
                                                        headers: {
                                                            'Content-Length': contentLength,
                                                            'Content-Type': 'application/x-www-form-urlencoded'
                                                        },
                                                        uri: obj,
                                                        body: formData,
                                                        method: 'POST'
                                                    }, function (error, response, body) {
                                                        if (error) {
                                                            res.json(error);
                                                        } else if (response.statusCode == 200) {
                                                            a = JSON.parse(body);
                                                            res.json({"err_code": 0, "data": a});
                                                        } else if (response.statusCode != 200) {
                                                            if (body != null) {
                                                                res.json({
                                                                    "err_code": response.statusCode,
                                                                    "err_msg": body
                                                                });
                                                            } else {
                                                                res.json({
                                                                    "err_code": response.statusCode,
                                                                    "err_msg": response
                                                                });
                                                            }
                                                        } else {
                                                            res.json({"err_code": 500, "err_msg": "undefined error"});
                                                        }
                                                    });
                                                } else {
                                                    res.json({"err_code": 500, "err_msg": "statusDir is empty"});
                                                }
                                            } else {
                                                res.json({"err_code": 500, "err_msg": "username is empty"});
                                            }
                                        } else {
                                            res.json({
                                                "err_code": 2,
                                                "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                            });
                                        }
                                    }
                                })
                            } else {
                                result2.err_code == 500;
                                res.json(result);
                            }
                        });
                    } else {
                        result.err_code = 500;
                        res.json(result);
                    }
                });
            } else {
                res.json({"err_code": 500, "err_msg": "Body is empty"})
            }
        },
        fileQuery: function makeFileQuery(req, res) {
            if (Object.keys(req.body).length) {
                var ipAddres = req.connection.remoteAddress;
                var apikey = req.params.apikey;
                var ipAddresHeader = req.headers.api;
                var username = req.body.username;
                var file = req.body.file;
                var statusdir = req.body.statusdir;

                //check ip dengan header
                if (typeof ipAddresHeader !== 'undefined') {
                    ipAddres = ipAddresHeader;
                }

                checkApikey(apikey, ipAddres, function (result) {
                    if (result.err_code == 0) {
                        getUserByApikey(apikey, function (result2) {
                            if (result2.err_code == 0) {
                                //ambil cluster_id
                                var cluster_id = result2.user_cluster_id;
                                var user_id = result2.user_id;

                                Api_cluster.findJoin({"cluster_id": cluster_id}, {Config: "config_cluster_id"}, function (err, data) {
                                    if (err) {
                                        res.json(err);
                                    } else {
                                        var job_config = data;
                                        if (job_config.length > 0) {
                                            //mengambil konfigurasi cluster
                                            for (var i = 0; i < job_config[0].Configs.length; i++) {
                                                if (job_config[0].Configs[i].config_key == "hivecluster") {
                                                    hiveHostname = job_config[0].Configs[i].config_value;
                                                }
                                                if (job_config[0].Configs[i].config_key == "hive_port") {
                                                    hivePort = job_config[0].Configs[i].config_value;
                                                }
                                            }

                                            if (username != null) {
                                                if (statusdir != null) {
                                                    //http://192.168.1.199:50111/templeton/v1/hive?user.name=hdfs
                                                    var hive = hiveHostname + ':' + hivePort + '/templeton/v1/hive';
                                                    var obj = hive + '?user.name=' + username;
                                                    var form = {
                                                        file: file,
                                                        statusdir: statusdir
                                                    };

                                                    var formData = querystring.stringify(form);
                                                    var contentLength = formData.length;
                                                    request({
                                                        headers: {
                                                            'Content-Length': contentLength,
                                                            'Content-Type': 'application/x-www-form-urlencoded'
                                                        },
                                                        uri: obj,
                                                        body: formData,
                                                        method: 'POST'
                                                    }, function (error, response, body) {
                                                        if (error) {
                                                            res.json(error);
                                                        } else if (response.statusCode == 200) {
                                                            a = JSON.parse(body);
                                                            res.json({"err_code": 0, "data": a});
                                                        } else if (response.statusCode != 200) {
                                                            if (body != null) {
                                                                res.json({
                                                                    "err_code": response.statusCode,
                                                                    "err_msg": body
                                                                });
                                                            } else {
                                                                res.json({
                                                                    "err_code": response.statusCode,
                                                                    "err_msg": response
                                                                });
                                                            }
                                                        } else {
                                                            res.json({"err_code": 500, "err_msg": "undefined error"});
                                                        }
                                                    });
                                                } else {
                                                    res.json({"err_code": 500, "err_msg": "statusDir is empty"});
                                                }
                                            } else {
                                                res.json({"err_code": 500, "err_msg": "username is empty"});
                                            }
                                        } else {
                                            res.json({
                                                "err_code": 2,
                                                "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                            });
                                        }
                                    }
                                })
                            } else {
                                result2.err_code == 500;
                                res.json(result);
                            }
                        });
                    } else {
                        result.err_code = 500;
                        res.json(result);
                    }
                });
            } else {
                res.json({"err_code": 500, "err_msg": "Body is empty"})
            }
        }
    },
    put: {
        createDatabase: function makeCreateDatabase(req, res) {
            if (Object.keys(req.body).length) {
                var ipAddres = req.connection.remoteAddress;
                var apikey = req.params.apikey;
                var ipAddresHeader = req.headers.api;
                var username = req.body.username;
                var dbname = req.body.dbname;
                var location = req.body.location;
                var comment = req.body.comment;
                var properties = req.body.prop;

                //check ip dengan header
                if (typeof ipAddresHeader !== 'undefined') {
                    ipAddres = ipAddresHeader;
                }

                checkApikey(apikey, ipAddres, function (result) {
                    if (result.err_code == 0) {
                        getUserByApikey(apikey, function (result2) {
                            if (result2.err_code == 0) {
                                //ambil cluster_id
                                var cluster_id = result2.user_cluster_id;
                                var user_id = result2.user_id;

                                Api_cluster.findJoin({"cluster_id": cluster_id}, {Config: "config_cluster_id"}, function (err, data) {
                                    if (err) {
                                        res.json(err);
                                    } else {
                                        var job_config = data;

                                        if (job_config.length > 0) {
                                            for (var i = 0; i < job_config[0].Configs.length; i++) {
                                                if (job_config[0].Configs[i].config_key == "hivecluster") {
                                                    hiveHostname = job_config[0].Configs[i].config_value;
                                                }
                                                if (job_config[0].Configs[i].config_key == "hive_port") {
                                                    hivePort = job_config[0].Configs[i].config_value;
                                                }
                                            }

                                            var pathname = 'templeton/v1/ddl/database';
                                            var ddl = hiveHostname + ':' + hivePort + '/' + pathname;
                                            var obj = ddl + '/' + dbname + '?user.name=' + username;
                                            console.log(obj);
                                            var options = {
                                                uri: obj,
                                                method: 'PUT',
                                                json: {
                                                    "comment": comment,
                                                    "location": location,
                                                    "properties": properties
                                                }
                                            }
                                            request(options, function (error, response, body) {
                                                if (error) {
                                                    res.json(error);
                                                } else if (response.statusCode == 200) {
                                                    console.log(body);
                                                    res.json({"err_code": 0, "data": body});
                                                } else if (response.statusCode != 200) {
                                                    res.json({"err_code": response.statusCode, "err_msg": body});
                                                } else {
                                                    res.json({"err_code": 500, "err_msg": "undefined error"});
                                                }
                                            });
                                        } else {
                                            res.json({
                                                "err_code": 2,
                                                "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                            });
                                        }
                                    }
                                })
                            } else {
                                result2.err_code == 500;
                                res.json(result);
                            }
                        });
                    } else {
                        result.err_code = 500;
                        res.json(result);
                    }
                });
            } else {
                res.json({"err_code": 500, "err_msg": "The Body is Empty"});
            }

        },
        createTable: function makeTable(req, res) {
            if (Object.keys(req.body).length) {
                var ipAddres = req.connection.remoteAddress;
                var apikey = req.params.apikey;
                var ipAddresHeader = req.headers.api;
                var username = req.body.username;
                var dbname = req.body.dbname;
                var tbname = req.body.tbname;
                var group = req.body.group;
                var permissions = req.body.permissions;
                var external = req.body.external;
                var ifNotExists = req.body.ifnotexists;
                var comment = req.body.comment;
                var columns = req.body.columns;
                var partitionedBy = req.body.partitionedBy;
                var clusteredBy = req.body.clusteredBy;
                var format = req.body.format;
                var location = req.body.location;
                var tableProp = req.body.tableprop;

                //check ip dengan header
                if (typeof ipAddresHeader !== 'undefined') {
                    ipAddres = ipAddresHeader;
                }

                checkApikey(apikey, ipAddres, function (result) {
                    if (result.err_code == 0) {
                        getUserByApikey(apikey, function (result2) {
                            if (result2.err_code == 0) {
                                //ambil cluster_id
                                var cluster_id = result2.user_cluster_id;
                                var user_id = result2.user_id;

                                Api_cluster.findJoin({"cluster_id": cluster_id}, {Config: "config_cluster_id"}, function (err, data) {
                                    if (err) {
                                        res.json(err);
                                    } else {
                                        var job_config = data;

                                        if (job_config.length > 0) {
                                            for (var i = 0; i < job_config[0].Configs.length; i++) {
                                                if (job_config[0].Configs[i].config_key == "hivecluster") {
                                                    hiveHostname = job_config[0].Configs[i].config_value;
                                                }
                                                if (job_config[0].Configs[i].config_key == "hive_port") {
                                                    hivePort = job_config[0].Configs[i].config_value;
                                                }
                                            }

                                            if (username != null) {
                                                var pathname = 'templeton/v1/ddl/database';
                                                var ddl = hiveHostname + ':' + hivePort + '/' + pathname;
                                                var obj = ddl + '/' + dbname + '/table/' + tbname + '?user.name=' + username;
                                                var options = {
                                                    uri: obj,
                                                    method: 'PUT',
                                                    json: {
                                                        "group": group,
                                                        "permissions": permissions,
                                                        "external": external,
                                                        "ifNotExists": ifNotExists,
                                                        "comment": comment,
                                                        "partitionedBy": partitionedBy,
                                                        "format": format,
                                                        "location": location,
                                                        "tableProperties": tableProp,
                                                        "columns": columns
                                                    }
                                                }

                                                request(options, function (error, response, body) {
                                                    if (error) {
                                                        res.json(error);
                                                    } else if (response.statusCode == 200) {
                                                        res.json({"err_code": 0, "msg": "success create table "});
                                                    } else if (response.statusCode != 200) {
                                                        res.json({"err_code": response.statusCode, "err_msg": body});
                                                    } else {
                                                        res.json({"err_code": 500, "err_msg": "Undefined Error"});
                                                    }

                                                });
                                            } else {
                                                res.json({"err_code": 500, "err_msg": "username is empty"});
                                            }
                                        } else {
                                            res.json({
                                                "err_code": 2,
                                                "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                            });
                                            console.log("Cluster Configuration is not found or user cluster is not set");
                                        }
                                    }
                                })
                            } else {
                                result2.err_code == 500;
                                res.json(result);
                            }
                        });
                    } else {
                        result.err_code = 500;
                        res.json(result);
                    }
                });
            } else {
                res.json({"err_code": 500, "err_msg": "The Body is empty"});
            }
        }
    },
    delete: {
        deleteDatabase: function deleteDb(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var username = req.query.username;
            var dbname = req.params.dbname;

            //check ip dengan header
            if (typeof ipAddresHeader !== 'undefined') {
                ipAddres = ipAddresHeader;
            }

            checkApikey(apikey, ipAddres, function (result) {
                if (result.err_code == 0) {
                    getUserByApikey(apikey, function (result2) {
                        if (result2.err_code == 0) {
                            //ambil cluster_id
                            var cluster_id = result2.user_cluster_id;
                            var user_id = result2.user_id;

                            Api_cluster.findJoin({"cluster_id": cluster_id}, {Config: "config_cluster_id"}, function (err, data) {
                                if (err) {
                                    res.json(err);
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {

                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "hivecluster") {
                                                hiveHostname = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "hive_port") {
                                                hivePort = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (username != null) {
                                            if (dbname != null) {
                                                var pathname = 'templeton/v1/ddl/database';
                                                var ddl = hiveHostname + ':' + hivePort + '/' + pathname;
                                                var obj = ddl + '/' + dbname + '?user.name=' + username;
                                                var options = {
                                                    uri: obj,
                                                    method: 'DELETE'
                                                }

                                                request(options, function (error, response, body) {
                                                    if (error) {
                                                        res.json(error);
                                                    } else if (response.statusCode == 200) {
                                                        res.json({"err_code": 0, "msg": "success delete database"})
                                                    } else {
                                                        a = JSON.parse(body);
                                                        res.json({"err_code": response.statusCode, "err_msg": a});
                                                    }
                                                });
                                            } else {
                                                res.json({"err_code": 500, "err_msg": "dbname is empty"});
                                            }
                                        } else {
                                            res.json({"err_code": 500, "err_msg": "username is empty"});
                                        }
                                    } else {
                                        res.json({
                                            "err_code": 2,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                    }
                                }
                            })
                        } else {
                            result2.err_code == 500;
                            res.json(result);
                        }
                    });
                } else {
                    result.err_code = 500;
                    res.json(result);
                }
            });

        },
        deleteTable: function deleteTb(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var username = req.query.username;
            var dbname = req.query.dbname;
            var tbname = req.query.tbname;

            //check ip dengan header
            if (typeof ipAddresHeader !== 'undefined') {
                ipAddres = ipAddresHeader;
            }

            checkApikey(apikey, ipAddres, function (result) {
                if (result.err_code == 0) {
                    getUserByApikey(apikey, function (result2) {
                        if (result2.err_code == 0) {
                            //ambil cluster_id
                            var cluster_id = result2.user_cluster_id;
                            var user_id = result2.user_id;

                            Api_cluster.findJoin({"cluster_id": cluster_id}, {Config: "config_cluster_id"}, function (err, data) {
                                if (err) {
                                    res.json(err);
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {

                                        for (var i = 0; i < job_config[0].Configs.length; i++) {

                                            if (job_config[0].Configs[i].config_key == "hivecluster") {
                                                hiveHostname = job_config[0].Configs[i].config_value;
                                            }

                                            if (job_config[0].Configs[i].config_key == "hive_port") {
                                                hivePort = job_config[0].Configs[i].config_value;
                                            }

                                        }

                                        if (username != null) {
                                            if (dbname != null && tbname != null) {
                                                var pathname = 'templeton/v1/ddl/database';
                                                var ddl = hiveHostname + ':' + hivePort + '/' + pathname;
                                                var obj = ddl + '/' + dbname + '/table/' + tbname + '?user.name=' + username;
                                                var options = {
                                                    uri: obj,
                                                    method: 'DELETE'
                                                }

                                                request(options, function (error, response, body) {
                                                    if (!error && response.statusCode == 200) {
                                                        console.log(body);
                                                        res.json({"err_code": 0, "msg": "success delete table "});
                                                    } else if (response.statusCode != 200) {
                                                        console.log(body);
                                                        console.log(response);
                                                        a = JSON.parse(body);
                                                        res.json({"err_code": response.statusCode, "err_msg": a});
                                                    } else {
                                                        if (error != null) {
                                                            res.json({"err_code": 500, "err_msg": error});
                                                        } else {
                                                            res.json({"err_code": 500, "err_msg": "Error undefined"});
                                                        }
                                                    }
                                                });
                                            } else {
                                                res.json({"err_code": 500, "err_msg": "dbname or tbname is Empty"});
                                            }
                                        } else {
                                            res.json({"err_code": 500, "err_msg": "Username is empty"})
                                        }
                                    } else {
                                        res.json({
                                            "err_code": 2,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                        console.log("Cluster Configuration is not found or user cluster is not set");
                                    }
                                }
                            })
                        } else {
                            result2.err_code == 500;
                            res.json(result);
                        }
                    });
                } else {
                    result.err_code = 500;
                    res.json(result);
                }
            });
        }
    }
}

//cekapikey
function checkApikey(apikey, ipAddres, callback) {
    Api_user.findWhere({"user_apikey": apikey}, function (err, data) {
        if (err) {
            x(err);
        } else {
            if (data.length > 0) {
                if (data[0].user_id == 1) {
                    x({"err_code": 0, "status": "root", "data": data});
                } else {
                    if (apikey == data[0].user_apikey) {
                        dataIpAddress = data[0].user_ip_address;
                        if (dataIpAddress.indexOf(ipAddres) >= 0) {
                            if (data[0].user_is_active) {
                                x({"err_code": 0, "status": "active", "data": data});
                            } else {
                                x({"err_code": 5, "err_msg": "User not active"});
                            }
                        } else {
                            x({"err_code": 4, "err_msg": "Ip Address not registered"});
                        }
                    } else {
                        x({"err_code": 3, "err_msg": "Wrong apikey"});
                    }
                }
            } else {
                x({"err_code": 3, "err_msg": "Wrong apikey"});
            }
        }
    });

    //method, endpoint, params, options, callback
    function x(result) {
        callback(result)
    }
}

function getUserByApikey(apikey, callback) {
    //method, endpoint, params, options, callback
    Api_user.findWhere({"user_apikey": apikey}, function (err, data) {
        if (err) {
            x(err);
        } else {
            if (data.length > 0) {
                var user_cluster_id = data[0].user_cluster_id;
                var user_id = data[0].user_id;
                if (user_cluster_id == null) {
                    Api_cluster.findWhere({"cluster_status": "default"}, function (err, data) {
                        if (err) {
                            x({"err_code": 500, "err_msg": err});
                        } else {
                            if (data.length > 0) {
                                x({"err_code": 0, "user_cluster_id": data[0].cluster_id, "user_id": user_id});
                            } else {
                                x({"err_code": 3, "err_msg": "default_config is not found"});
                            }
                        }
                    });
                } else {
                    x({"err_code": 0, "user_cluster_id": user_cluster_id, "user_id": user_id});
                }
            } else {
                x({
                    "err_code": 2,
                    "err_msg": "Apikey failed",
                    "application": "Api Baciro Oozie",
                    "function": "getUserByApikey"
                });
            }
        }
    });

    function x(result) {
        callback(result)
    }
}

//get method
app.get('/:apikey/hive/listdb', Hive.get.listDatabase);
app.get('/:apikey/hive/listtables', Hive.get.listTables);
app.get('/:apikey/hive/describetable', Hive.get.describeTable);
app.get('/:apikey/hive/listall', Hive.get.listDbTb);

//post method
app.post('/:apikey/hive/query', Hive.post.createQuery);
app.post('/:apikey/hive/filequery', Hive.post.fileQuery);

//put method
app.put('/:apikey/hive/createdb', Hive.put.createDatabase);
app.put('/:apikey/hive/createtb', Hive.put.createTable);

//delete method
app.delete('/:apikey/hive/deletedb/:dbname', Hive.delete.deleteDatabase);
app.delete('/:apikey/hive/deletetb/', Hive.delete.deleteTable);

var server = app.listen(port, host, function () {
    console.log("Server running at http://%s:%s", host, port);
})
