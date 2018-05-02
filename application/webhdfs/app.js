var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var yamlconfig = require('yaml-config');
var configYaml = yamlconfig.readConfig('../config/config.yml');
var Apiclient = require('apiclient');
var md5 = require('md5');
var path = require("path");
var Database = require("../mysql/Mysql.js");
var format = require('string-format')
var host = configYaml.webhdfs.host;
var port = configYaml.webhdfs.port;
var data2xml = require('data2xml');
var convert = data2xml({xmlheader: '<?xml version="1.0" standalone="yes" ?>\n'});
var Api_user = Database('User');
var Api_inventory = Database('Inventory');
var Api_project = Database('Project');
var Api_group = Database('Group');
var Api_member = Database('Member');
var id = /^[0-9]*$/;
var aneh =/\s/g;
var mkdirp = require('mkdirp');
var Hdfs = require('hdfs247');
var hdfs = new Hdfs({
    protocol: 'http',
    hostname: 'qc-01.solusi247.com',
    port: 50070
});
//setting midleware
app.use (function(req,res,next){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "DELETE, GET, POST, PUT, OPTIONS");
//  res.removeHeader("x-powered-by");
  next();
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))

// parse application/json
app.use(bodyParser.json({ limit: '50mb'}))
var id = /^[0-9]*$/;

var Project = {
			get: {
                listDirectory: function getListDirectory(req, res) {
                    var ipAddres = req.connection.remoteAddress;
                    var apikey = req.params.apikey;
                    var ipAddresHeader = req.headers.api;
                    var path = req.query.path;
                    var username = req.query.username;

                    //check ip dengan header
                    if (typeof ipAddresHeader !== 'undefined') {
                        ipAddres = ipAddresHeader;
                    }

                    if (path != null) {
                        checkApikey(apikey, ipAddres, function (result) {
                            if (result.err_code === 0) {

                                hdfs.liststatus({
                                    'user.name': username,
                                    path: path
                                }, function(error, response, body){
                                    if (response.statusCode === 200){
										obj = JSON.parse(response.body)
                                    	res.json({"err_code": 0, "data": obj});
									} else if (response.statusCode === 404){
                                    	res.json({"err_code": response.statusCode, "err_msg": "Directory not found"});
									} else {
                                    	res.json({"err_code": 500, "err_msg": "something wrong", "data": error});
									}
                                });

                            } else {
                                result.err_code = 500;
                                res.json(result);
                            }
                        })

                    } else {
                        res.json({"err_code": 500, "err_msg": "Path cannot be empty"});
                    }
                },
				hanalyticsOpenRead: function getOpenReadFile(req, res) {
                    var ipAddres = req.connection.remoteAddress;
                    var apikey =  req.params.apikey;
                    var ipAddresHeader = req.headers.api;
                    var path = req.query.path;
                    var offset = req.query.offset;
                    var length = req.query.length;
                    var buffersize = req.query.buffer;
					var username = req.query.username;

                    //check ip dengan header
                    if (typeof ipAddresHeader !== 'undefined') {
                        ipAddres = ipAddresHeader;
                    }

                    if(path !== null){
                        checkApikey(apikey, ipAddres, function (result) {
                            if (result.err_code === 0) {
                                hdfs.download({
                                    'user.name': username,
                                    path: path,
                                    offset: offset,
									length: length,
									buffersize: buffersize
                                }, function(error, response, body){
									if (response.statusCode == 200){
										var obj = response.request.headers.referer;
										res.json({"err_code": 0, "data": obj});
									} else if (response.statusCode !== 200) {
										if (response.statusCode === 404){
											res.json({"err_code": response.statusCode, "err_msg": "File not found"});
										} else {
											res.json({"err_code": 500, "err_msg": response});
										}
									}

                                });

                            } else {
                                result.err_code = 500;
                                res.json(result);
                            }
                        })
					} else {
                    	res.json({"err_code": 500, "err_msg": "Path cannot be empty"});
					}
                },
				hanalyticsGetStatus: function getStatus(req, res) {
                    var ipAddres = req.connection.remoteAddress;
                    var apikey =  req.params.apikey;
                    var ipAddresHeader = req.headers.api;
                    var path = req.query.path;
                    var username = req.query.username;

                    //check ip dengan header
                    if (typeof ipAddresHeader !== 'undefined') {
                        ipAddres = ipAddresHeader;
                    }

                    if(path != null ) {
                    	checkApikey(apikey, ipAddres, function (result) {
							if (result.err_code === 0){
								hdfs.getfilestatus({
									'user.name': username,
									path: path
								}, function (error, response, body) {
									if (response.statusCode === 404) {
										res.json({"err_code": 404, "err_msg": "File or Directory not found"});
									}
									else if (response.statusCode === 200){
										obj = JSON.parse(response.body);
										res.json({"err_code": 0, "data": obj});
									}
									else {
										res.json({"err_code": 500, "err_msg": response});
									}
                                });
							}
                        })
					} else {
                    	res.json({"err_code": 5, "err_msg": "Path cannot be empty"});
					}

				}
			},
			post: {
                hanalyticsCreateFile: function createFile(req, res) {
                    if(Object.keys(req.body).length){
                        var ipAddres = req.connection.remoteAddress;
                        var apikey = req.params.apikey;
                        var ipAddresHeader = req.headers.api;
                        var path = req.body.path;
                        var blocksize = req.body.block;
                        var replication = req.body.replica;
                        var permission = req.body.permission;
                        var buffersize = req.body.buffersize;
                        var overwrite = req.body.overwrite;
                        var username = req.body.username;

                        //check ip dengan header
                        if (typeof ipAddresHeader !== 'undefined') {
                            ipAddres = ipAddresHeader;
                        }

                        checkApikey(apikey, ipAddres, function(result){
                            if (path !== null) {

								hdfs.create({
									'user.name': username,
									path: path,
									overwrite: overwrite,
									blocksize: blocksize,
									replication: replication,
									permission: permission,
									buffersize: buffersize
								}, function(error, response, body){
									if (response.statusCode === 200){
										obj = JSON.parse(response.body);
										res.json({"err_code": 0, "msg": "success create a file", "data": obj});
									} else {
                                        obj = JSON.parse(response.body);
										res.json({"err_code": response.statusCode, "err_msg": obj});
									}
									res.json(response);
								});
                            } else {
                                res.json({"err_code": 5, "err_msg": "Path cannot be empty"});
                            }
                        });

                    } else {
                        res.json({"err_code": 500,"err_code": "Body is empty"});
                    }
                }
			},	
			put: {
				hanalyticsRename: function renameFile(req, res){
                    if(Object.keys(req.body).length){
                        var ipAddres = req.connection.remoteAddress;
                        var apikey = req.params.apikey;
                        var ipAddresHeader = req.headers.api;
                        var path = req.body.path;
                        var destination = req.body.destination;
                        var username = req.body.username;

                        //check ip dengan header
                        if (typeof ipAddresHeader !== 'undefined') {
                            ipAddres = ipAddresHeader;
                        }

                        if (path != null){
                            hdfs.rename({
                                'user.name': username,
                                path: path,
                                destination: destination
                            }, function(error, response, body){
                                if (response.statusCode === 200){
                                    obj = JSON.parse(response.body);
                                    res.json({"err_code": 0, "msg": "Rename Success", "data": obj});
                                } else if(response.statusCode !== 200){
                                    obj = JSON.parse(response.body);
                                    obj2 = obj.RemoteException;
                                    res.json({"err_code": response.statusCode, "err_msg": obj2.message});
                                }else {
                                    res.json({"err_code": 500, "err_msg": response});
                                }
                            });
						} else {
                        	res.json({"err_code": 500, "err_msg": "Path cannot be empty"});
						}

                    } else {
                    	res.json({"err_code": 500, "err_msg": "Body is empty"});
					}
				},
				hanalyticsMkdir: function mkdir(req, res){
                    if(Object.keys(req.body).length){
                        var ipAddres = req.connection.remoteAddress;
                        var apikey = req.params.apikey;
                        var ipAddresHeader = req.headers.api;
                        var path = req.body.path;
                        var permission = req.body.permission;
                        var username = req.body.username;

                        //check ip dengan header
                        if (typeof ipAddresHeader !== 'undefined') {
                            ipAddres = ipAddresHeader;
                        }

                        hdfs.mkdirs({
                            'user.name': username,
                            path: path,
							permission: permission

                        }, function(error, response, body){
                        	if (response.statusCode === 200){
                        		res.json({"err_code": 0, "msg": "Success create new directory", "data": response.request.uri.pathname});
							} else if (response !== 200){
                        		res.json({"err_code": response.statusCode, "err_msg": response});
							} else {
                        		res.json({"err_code": 500, "err_msg": error});
							}
                        });

					} else {
                        res.json({"err_code": 500, "err_msg": "Body is empty"});
					}
				}
			},	
			delete: {
                hanalyticsDelete: function deleteFileDir(req, res){
                    var ipAddres = req.connection.remoteAddress;
                    var apikey = req.params.apikey;
                    var ipAddresHeader = req.headers.api;
                    var path = req.body.path;
                    var recursive = req.body.recursive;
                    var username = req.body.username;

                    //check ip dengan header
                    if (typeof ipAddresHeader !== 'undefined') {
                        ipAddres = ipAddresHeader;
                    }

                    checkApikey(apikey, ipAddres, function (result) {
						if (result.err_code == 0){
							if (path != null){
								hdfs.delete({
                                    'user.name': username,
                                    path: path,
									recursive: recursive
								}, function(error, response, body) {
									if (response.statusCode === 200){
										obj = JSON.parse(response.body);
										res.json({"err_code": 0, "msg": "Delete file success", "data": obj});
									} else if (response.statusCode !== 200) {
                                        obj = JSON.parse(response.body);
                                        obj2 = obj.RemoteException;
                                        res.json({"err_code": response.statusCode, "err_msg": obj2.message});
									} else {
										res.json({"err_code": 500, "err_msg": "Something error"});
									}
                                });
							} else {
								res.json({"err_code": 500, "err_msg": "Path is empty"})
							}
						} else {
							result.err_code = 500;
							res.json(result);
						}
                    })
				}
			}
}


//cekapikey
function checkApikey(apikey, ipAddres, callback){
	Api_user.findWhere({"user_apikey" : apikey}, function(err, data){
    if(err){
      x(err);
    }else{
      if(data.length>0){
        if(data[0].user_id==1){
          x({"err_code": 0, "status": "root", "data" : data});
        }else{
          if(apikey==data[0].user_apikey){
              dataIpAddress = data[0].user_ip_address;
              if(dataIpAddress.indexOf(ipAddres)>=0){
                  if(data[0].user_is_active){
                      x({"err_code": 0, "status": "active", "data" : data});
                  }else{
                      x({"err_code": 5, "err_msg": "User not active"});
                  }
              }else{
                x({"err_code": 4, "err_msg": "Ip Address not registered"});
              }
          }else{
            x({"err_code": 3, "err_msg": "Wrong apikey"});
          }
        }
      }else{
	  		x({"err_code": 3, "err_msg": "Wrong apikey"});
	  	}
    }
  });
	//method, endpoint, params, options, callback
	function x(result){
		callback(result)
	}
}

//get method
app.get('/:apikey/webhdfs/list', Project.get.listDirectory);
app.get('/:apikey/webhdfs/download', Project.get.hanalyticsOpenRead);
app.get('/:apikey/webhdfs/status', Project.get.hanalyticsGetStatus);

//post method
app.post('/:apikey/webhdfs/create', Project.post.hanalyticsCreateFile);

//put method
app.put('/:apikey/webhdfs/rename', Project.put.hanalyticsRename);
app.put('/:apikey/webhdfs/mkdir', Project.put.hanalyticsMkdir);

//delete method
app.delete('/:apikey/webhdfs/delete', Project.delete.hanalyticsDelete);


var server = app.listen(port, host, function () {
  console.log("Server running at http://%s:%s", host, port);
})
