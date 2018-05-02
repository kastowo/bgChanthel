var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var yamlconfig = require('yaml-config');
var configYaml = yamlconfig.readConfig('../config/config.yml');

var host = configYaml.resource_manager.host;
var port = configYaml.resource_manager.port;
var request = require('request');
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

var Project = {
    get: {
        clusterApp: function getClusterApp(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var appid = req.params.appid;

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
                                    console.log(err);
                                    res.json({
                                        "err_code": 500,
                                        "status": "INTERNAL ERROR",
                                        "err_msg": "Undefined error, see console log for more details"
                                    });
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        var projectName = data[0].Configs[0].config_value;

                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "resource_manager_host") {
                                                rm_host = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "resource_manager_port") {
                                                rm_port = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (rm_host != null && rm_host != null) {
                                            // GET http://<rm http address:port>/ws/v1/cluster/apps/application_1326821518301_0005
                                            var base = rm_host + ":" + rm_port + "/ws/v1/cluster/apps/" + appid;

                                            var options = {
                                                uri: base,
                                                method: 'GET'
                                            }

                                            request(options, function (error, response, body) {
                                                if (error) {
                                                    console.log(error);
                                                    res.json({
                                                        "err_code": 500,
                                                        "status": "INTERNAL ERROR",
                                                        "err_msg": "Undefined error when send request, see console log for more details"
                                                    });
                                                } else {
                                                    if (response.statusCode == 200) {
                                                        obj = JSON.parse(body);
                                                        res.json({
                                                            "err_code": 200,
                                                            "status": "OK",
                                                            "data": obj
                                                        });
                                                    } else {
                                                        if (body != null && body != "") {
                                                            obj = JSON.parse(body);
                                                            obj2 = obj.RemoteException.message;

                                                            if (obj2 != null) {
                                                                res.json({
                                                                    "err_code": response.statusCode,
                                                                    "err_msg": obj2
                                                                });
                                                            } else {
                                                                console.log(response);
                                                                res.json({
                                                                    "err_code": response.statusCode,
                                                                    "err_msg": "There was an error processing your request. Your request is "+response.request.uri.href
                                                                });
                                                            }
                                                        } else {
                                                            console.log(response);
                                                            res.json({
                                                                "err_code": response.statusCode,
                                                                "err_msg": "There was an error processing your request. Your request is "+response.request.uri.href
                                                            });
                                                        }
                                                    }

                                                }
                                            });

                                        } else {
                                            res.json({
                                                "err_code": 404,
                                                "err_msg": "Configuration cluster for Resource Manager is not found"
                                            });
                                        }
                                    } else {
                                        res.json({
                                            "err_code": 404,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                    }
                                }
                            })
                        } else {
                            result2.err_code == 400;
                            res.json(result);
                        }
                    });
                } else {
                    result.err_code = 400;
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
                                x({"err_code": 400, "err_msg": "User not active"});
                            }
                        } else {
                            x({"err_code": 403, "err_msg": "Ip Address not registered"});
                        }
                    } else {
                        x({"err_code": 400, "err_msg": "Wrong apikey"});
                    }
                }
            } else {
                x({"err_code": 400, "err_msg": "Wrong apikey"});
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
                                x({"err_code": 404, "err_msg": "default_config is not found"});
                            }
                        }
                    });
                } else {
                    x({"err_code": 0, "user_cluster_id": user_cluster_id, "user_id": user_id});
                }
            } else {
                x({
                    "err_code": 400,
                    "err_msg": "Apikey failed",
                    "application": "Api Resource Manager",
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
app.get('/:apikey/resourcemanager/application/:appid', Project.get.clusterApp);


var server = app.listen(port, host, function () {
    console.log("Server running at http://%s:%s", host, port);
})
