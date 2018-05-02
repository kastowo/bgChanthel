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
    hostname: '192.168.1.207',
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
                                    if (response.statusCode == 200 | response.statusCode == 201){
										obj = JSON.parse(response.body)
                                    	res.json({
                                            "err_code": 0,
                                            "data": obj
                                    	});
									} else if (response.statusCode == 404){
                                    	res.json({
                                            "err_code": response.statusCode,
                                            "err_msg": "Directory not found"
                                    	});
									} else if (response.statusCode != null && response.body != ""){

                                        obj = JSON.parse(response.body);
                                        res.json({
                                            "err_code": response.statusCode,
                                            "err_msg": obj
                                    	});
									} else if (response.statusCode != null) {
                                        res.json({
                                            "err_code": response.statusCode,
                                            "err_msg": response
                                        });
                                    } else {
                                        res.json({
                                            "err_code": 500,
                                            "err_msg": error
                                        });
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
				openRead: function getOpenReadFile(req, res) {
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
                                    path: path

                                }, function(error, response, body){
									if (response.statusCode == 200){
										var obj = response.request.headers.referer;
										res.json({"err_code": 0, "data": obj});
									}

									if (response.statusCode != 200) {
										if (response.statusCode == 404){
											res.json({"err_code": response.statusCode, "err_msg": "File not found"});
										} else {
											res.json({"err_code": 500, "err_msg": error});
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
				getStatus: function getStatus(req, res) {
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
                    	res.json({"err_code": 500, "err_msg": "Path cannot be empty"});
					}

				},
                openFile: function getOpen(req, res) {
                    var ipAddres = req.connection.remoteAddress;
                    var apikey =  req.params.apikey;
                    var ipAddresHeader = req.headers.api;
                    var path = req.query.path;
                    var username = req.query.username;
                    var offset = req.query.offset;
                    var length = req.query.length;
                    var buffersize = req.query.buffersize;

                    //check ip dengan header
                    if (typeof ipAddresHeader !== 'undefined') {
                        ipAddres = ipAddresHeader;
                    }

                    if (path != null) {
                        hdfs.open({
                            'user.name': username,
                            path: path,
                            offset: offset,
                            length: length,
                            buffersize: buffersize
                        }, function(error, response, body) {
                            if (response.statusCode == 200) {
                                res.json(response.body);
                            } else if (response.statusCode != 200) {
                                if (response.statusCode == 404) {
                                    res.json({
                                        "err_code": response.statusCode,
                                        "err_msg": "File not found"
                                    });
                                } else {
                                    if (response.body != null && response.body != ""){
                                        obj = JSON.parse(response.body);
                                        res.json({
                                            "err_code": response.statusCode,
                                            "err_msg": obj
                                        });
                                    } else {
                                        res.json({"err_code": response.statusCode, "err_msg": response});
                                    }
                                }

                            } else {
                                res.json({"err_code": 500, "err_msg": error});
                            }
                        });
                    } else {
                        res.json({"err_code": 500, "err_msg": "Path cannot be empty"});
                    }
                },
                homeDir: function getHomeDir(req, res) {
                    var ipAddres = req.connection.remoteAddress;
                    var apikey =  req.params.apikey;
                    var ipAddresHeader = req.headers.api;

                    //check ip dengan header
                    if (typeof ipAddresHeader !== 'undefined') {
                        ipAddres = ipAddresHeader;
                    }
                    hdfs.gethomedirectory({

                    }, function(error, response, body) {
                        if (response.statusCode == 200) {
                            obj = JSON.parse(response.body);
                            res.json({"err_code": 0, "data": obj});
                        } else if (response != 200) {

                        } else {
                            res.json({"err_code": 500, "err_msg": error});
                        }
                    });
                },
                contentSummary: function getContentSummary(req, res) {
                    var ipAddres = req.connection.remoteAddress;
                    var apikey =  req.params.apikey;
                    var ipAddresHeader = req.headers.api;
                    var path = req.query.path;
                    var username = req.query.username;

                    //check ip dengan header
                    if (typeof ipAddresHeader !== 'undefined') {
                        ipAddres = ipAddresHeader;
                    }

                    hdfs.getcontentsummary({
                        'user.name': username,
                        path: path
                    }, function(error, response, body){
                        if (response.statusCode == 200) {
                            obj = JSON.parse(response.body);
                            res.json({"err_code": 0, "data": obj});
                        } else if (response.statusCode != 200) {
                            if (response.body != null) {
                                obj = JSON.parse(response.body);
                                res.json({"err_code": response.statusCode, "err_msg": obj});
                            } else {
                                res.json({"err_code": response.statusCode, "err_msg": response});
                            }
                        } else {
                            res.json({"err_code": 500, "err_msg": error});
                        }

                    });
                },
                filechecksum: function getFileChecksum(req, res) {
                    var ipAddres = req.connection.remoteAddress;
                    var apikey =  req.params.apikey;
                    var ipAddresHeader = req.headers.api;
                    var path = req.query.path;
                    var username = req.query.username;

                    //check ip dengan header
                    if (typeof ipAddresHeader !== 'undefined') {
                        ipAddres = ipAddresHeader;
                    }

                    hdfs.getfilechecksum({
                        path: path
                    }, function(error, response, body) {
                        if (response.statusCode == 200) {

                            obj = JSON.parse(response.body);
                            res.json({"err_code": 0, "data": obj});

                        } else if (response.statusCode != 200) {

                            if (response.statusCode == 404){

                                res.json({
                                    "err_code": 404,
                                    "err_msg": "File not found or path is not file"
                                });

                            } else {

                                if (response.body != null) {
                                    obj = JSON.parse(response.body)
                                    res.json({"err_code": response.statusCode, "err_msg": obj});
                                } else {

                                    res.json({"err_code": response.statusCode, "err_msg": response});
                                }
                            }
                        } else {
                            res.json({"err_msg": 500, "err_msg": error});
                        }
                    });
                }
			},
			post: {
                createFile: function createFile(req, res) {
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
                            if (result.err_code == 0) {
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
                                        if ((response.statusCode == 200) || (response.statusCode == 201)){
                                            res.json({
                                                "err_code": 0,
                                                "msg": "success create a file"
                                            });

                                        } else if (response.statusCode != 200){
                                            if (response.body != null && response.body != "") {
                                                obj = JSON.parse(response.body);
                                                res.json({
                                                    "err_code": response.statusCode,
                                                    "err_msg": obj
                                                });

                                            } else {
                                                res.json({
                                                    "err_code": response.statusCode,
                                                    "err_msg": response
                                                });
                                            }

                                        } else {
                                            if (error == null){
                                                res.json({
                                                    "err_code": 500,
                                                    "err_msg": "Something wrong! Contact developer"
                                                });
                                            } else {
                                                res.json({
                                                    "err_code": 500,
                                                    "err_msg": error
                                                });
                                            }

                                        }

                                    });
                                } else {
                                    res.json({"err_code": 5, "err_msg": "Path cannot be empty"});
                                }
                            } else {
                                result.err_code = 500;
                                res.json(result);
                            }

                        });

                    } else {
                        res.json({"err_code": 500,"err_code": "Body is empty"});
                    }
                },
                concat: function concatFile(req, res) {
                    if(Object.keys(req.body).length){

                        var ipAddres = req.connection.remoteAddress;
                        var apikey = req.params.apikey;
                        var ipAddresHeader = req.headers.api;
                        var path = req.body.path;
                        var sources = req.body.sources;

                        //check ip dengan header
                        if (typeof ipAddresHeader !== 'undefined') {
                            ipAddres = ipAddresHeader;
                        }

                        checkApikey(apikey, ipAddres, function(result) {

                            if (path != null){
                                hdfs.concat({
                                    path: path,
                                    sources: sources
                                }, function(error, response, body) {
                                    if (response.statusCode == 200) {
                                        res.json(response);
                                    } else if (response.statusCode != 200) {
                                        res.json({
                                            "err_code": response.statusCode,
                                            "err_msg": response
                                        });
                                    } else {
                                        res.json({"err_code": 500, "err_msg": error});
                                    }
                                });
                            } else {
                                res.json({
                                    "err_code": 500,
                                    "err_msg": "Path cannot be empty"
                                });
                            }
                        });

                    } else {
                        res.json({"err_code": 500,"err_code": "Body is empty"});
                    }
                },
                append: function appendFile(req, res) {
                    if(Object.keys(req.body).length) {

                        var ipAddres = req.connection.remoteAddress;
                        var apikey = req.params.apikey;
                        var ipAddresHeader = req.headers.api;
                        var path = req.body.path;
                        var localpath = req.body.localpath;
                        var buffersize = req.body.bufferzie;
                        var username = req.body.username;

                        //check ip dengan header
                        if (typeof ipAddresHeader !== 'undefined') {
                            ipAddres = ipAddresHeader;
                        }

                        checkApikey(apikey, ipAddres, function(result) {
                            // if(result.status == "root") {
                                if (path != null) {
                                    hdfs.append({
                                        'user.name': username,
                                        path: path,
                                        localpath: localpath,
                                        buffersize: buffersize
                                    }, function(error, response, body){

                                        if (error != null){
                                           res.json({"err_code": 500, "err_msg": error});
                                        } else if (response != 'undefined') {
                                            if (response.statusCode == 200) {
                                                res.json({"err_code": 0, "msg": "Append file success"});
                                            } else if (response.statusCode == 404) {
                                                obj = JSON.parse(response.body);
                                                res.json({"err_code": 404, "err_msg": obj});
                                            } else {
                                                res.json({"err_code": response.statusCode, "err_msg": response});
                                            }
                                        } else {
                                            res.json({"err_code": 500, "err_msg": error});
                                        }

                                    });
                                } else {
                                    res.json({"err_code": 500, "err_msg": "Path cannot be empty"});
                                }
                            // } else {
                            //     res.json({"err_code": 3, "err_msg": "Access Denied"});
                            // }
                        });

                    } else {
                        res.json({"err_code": 500,"err_code": "Body is empty"});
                    }
                }
			},	
			put: {
				rename: function updaterenameFile(req, res){
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
                                if (response.statusCode == 200){
                                    obj = JSON.parse(response.body);
                                    if (obj.boolean == false){
                                        res.json({
                                            "err_code": 400,
                                            "err_msg": "Rename failed. Nothing change"
                                        });
                                    } else {
                                        res.json({
                                            "err_code": 0,
                                            "msg": "Rename Success"
                                        });
                                    }

                                } else if(response.statusCode !== 200){
                                    if ((response.body != null) || (response.body != "")) {
                                        obj = JSON.parse(response.body);
                                        obj2 = obj.RemoteException;
                                        res.json({
                                            "err_code": response.statusCode,
                                            "err_msg": obj2.message
                                        });
                                    } else {
                                        res.json({
                                            "err_code": response.statusCode,
                                            "err_msg": response
                                        });
                                    }

                                }else {
                                    if (error == null) {
                                        res.json({"err_code": 500, "err_msg": error});
                                    } else {
                                        res.json({"err_code": 500, "err_msg": "Something  wrong! Contact the developer!"});
                                    }

                                }
                            });
						} else {
                        	res.json({"err_code": 500, "err_msg": "Path cannot be empty"});
						}

                    } else {
                    	res.json({"err_code": 500, "err_msg": "Body is empty"});
					}
				},
				mkdir: function updatemkdir(req, res){
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
                        		res.json({
                                    "err_code": 0,
                                    "msg": "Success create new directory",
                                    "data": response.request.uri.pathname
                        		});
							} else if (response !== 200){
                        	    if (response.body != null && response.body != "") {
                        	        obj = JSON.parse(response.body);
                                    res.json({"err_code": response.statusCode, "err_msg": obj});
                                } else {
                        	        res.json({"err_code": response.statusCode, "err_msg": response});
                                }

							} else {
                        	    if (error != null){
                                    res.json({"err_code": 500, "err_msg": error});
                                } else {
                        	        res.json({"err_code": 500, "err_msg": "Something wrong! Contact the developer"});
                                }

							}
                        });

					} else {
                        res.json({"err_code": 500, "err_msg": "Body is empty"});
					}
				},
                createWrite: function updatecreateWrite(req, res) {
                    if(Object.keys(req.body).length) {
                        var ipAddres = req.connection.remoteAddress;
                        var apikey = req.params.apikey;
                        var ipAddresHeader = req.headers.api;
                        var remotepath = req.body.path;
                        var localpath = req.body.localpath;
                        var username = req.body.username;
                        var overwrite = req.body.overwrite;
                        var blocksize = req.body.blocksize;
                        var replication = req.body.replication;
                        var permission = req.body.permission;
                        var buffersize = req.body.buffersize;

                        //check ip dengan header
                        if (typeof ipAddresHeader !== 'undefined') {
                            ipAddres = ipAddresHeader;
                        }

                        if (path != null) {
                            hdfs.upload({
                                'user.name': username,
                                overwrite: true,
                                localpath: localpath,
                                path: remotepath


                            }, function(error, response, body) {
                                if (response.statusCode == 200) {
                                    res.json({"err_code": 0, "msg": "Success Writing file"});
                                } else if (response.statusCode != 200) {
                                    res.json({"err_code": response.statusCode, "err_msg": response});
                                } else {
                                    res.json({"err_code": 500, "err_msg": error});
                                }
                            });
                        } else {
                            res.json({"err_code": 500, "err_msg": "Path cannot be empty"});
                        }

                    } else {
                        res.json({"err_code": 500, "err_msg": "The body cannot be empty"});
                    }

                },
                setPermission: function updatePermission(req, res) {
				    if (Object.keys(req.body).length) {
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
                        checkApikey(apikey, ipAddres, function (result) {

                            if (result.err_code === 0) {
                                hdfs.setpermission({
                                    'user.name': username,
                                    path: path,
                                    permission: permission
                                }, function(error, response, body){
                                    console.log(error+" ini error gan");
                                    console.log(response);
                                    if (error == null) {
                                        if (response.statusCode == 200) {
                                            res.json({"err_code": 0, "err_msg": "Success set permission"});
                                        } else if (response.body != null && response.body != ""){
                                            obj = JSON.parse(response.body);
                                            res.json({
                                                "err_code": response.statusCode,
                                                "err_msg": obj
                                            });
                                        } else {
                                            res.json({
                                                "err_code": 500,
                                                "err_msg": response
                                            });
                                        }

                                    } else {
                                        res.json({"err_code": 500, "err_msg": error});
                                    }
                                    res.json(response);
                                });
                            } else {
                                result.err_code = 500;
                                res.json(result);
                            }
                        })
                    } else {
				        res.json({"err_code": 500, "err_msg": "Body is empty"});
                    }
                },
                setOwner: function updateOwner(req, res) {
				    if (Object.keys(req.body).length) {
                        var ipAddres = req.connection.remoteAddress;
                        var apikey = req.params.apikey;
                        var ipAddresHeader = req.headers.api;
                        var path = req.body.path;
                        var username = req.body.username;
                        var owner = req.body.owner;
                        var group = req.body.group;

                        //check ip dengan header
                        if (typeof ipAddresHeader !== 'undefined') {
                            ipAddres = ipAddresHeader;
                        }

                        checkApikey(apikey, ipAddres, function (result) {
                           if (result.err_code === 0) {
                               hdfs.setowner({
                                   'user.name': username,
                                   path: path,
                                   owner: owner,
                                   group: group
                               }, function(error, response, body){
                                   console.log(error+" ini error gan");
                                   console.log(response+" ini response gan");
                                   if (response.statusCode == 200){
                                       res.json({"err_code": 0, "data": response});
                                   } else if (response.statusCode != 200 && response.body != null) {
                                       obj = JSON.parse(response.body);
                                       res.json({"err_code": response.statusCode, "err_msg": obj});
                                   } else if (response.statusCode != 200) {
                                       res.json({"err_code": response.statusCode, "err_msg": response});
                                   } else {
                                       res.json({"err_code": 500, "err_msg": error});
                                   }
                               })
                           } else {
                               result.err_code = 500;
                               res.json(result);
                           }
                        });
                    } else {
				        res.json({"err_code": 500, "err_msg": "Body is empty"});
                    }
                },
                setReplication: function updateReplication(req, res) {
                    if (Object.keys(req.body).length) {
                        var ipAddres = req.connection.remoteAddress;
                        var apikey = req.params.apikey;
                        var ipAddresHeader = req.headers.api;
                        var path = req.body.path;
                        var username = req.body.username;
                        var replication = req.body.replication;

                        //check ip dengan header
                        if (typeof ipAddresHeader !== 'undefined') {
                            ipAddres = ipAddresHeader;
                        }

                        hdfs.setreplication({
                            'user.name': username,
                            path: path,
                            replication: replication
                        }, function(error, response, body){
                            if (response.statusCode == 200) {
                                res.json({"err_code": 0, "msg": "Success set replication"});
                            } else if (response.statusCode != 200 && response.body != "" && response.body != null) {
                                obj = JSON.parse(response.body);
                                res.json({"err_code": response.statusCode, "err_msg": obj});
                            } else if (response.statusCode != 200) {
                                res.json({"err_code": 500, "err_msg": response});
                            } else {
                                res.json({"err_code": 500, "err_msg": error});
                            }
                        });

                    } else {
                        res.json({"err_code": 500, "err_msg": "Body is empty"});
                    }
                },
                setTimes: function modificationTimes(req,res) {
                    if (Object.keys(req.body).length){
                        var ipAddres = req.connection.remoteAddress;
                        var apikey = req.params.apikey;
                        var ipAddresHeader = req.headers.api;
                        var path = req.body.path;
                        var username = req.body.username;
                        var modificationtime = req.body.modif;
                        var accesstime = req.body.accesstime;

                        //check ip dengan header
                        if (typeof ipAddresHeader !== 'undefined') {
                            ipAddres = ipAddresHeader;
                        }

                        hdfs.settimes({
                            'user.name': username,
                            path: path,
                            modificationtime: modificationtime,
                            accesstime: accesstime

                        }, function(error, response, body) {
                            if (response.statusCode == 200){
                                res.json({"err_code": 0, "msg": "Success modification time"});
                            } else if (response.statusCode != 200 && response.body != null && response.body != "") {
                                obj = JSON.parse(response.body);
                                res.json({"err_code": response.statusCode, "err_msg": obj});
                            } else if (response.statusCode != 200) {
                                res.json({"err_code": response.statusCode, "err_msg": response})
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
                Delete: function deleteFileDir(req, res){
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
									    obj = JSON.parse(response.body)
									    if (obj.boolean == false){
									        res.json({
                                                "err_code": 404,
                                                "err_msg": "File not found"
                                            });
                                        } else {
                                            res.json({
                                                "err_code": 0,
                                                "msg": "Delete file success"
                                            });
                                        }

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
app.get('/:apikey/webhdfs/download', Project.get.openRead);
app.get('/:apikey/webhdfs/status', Project.get.getStatus);
app.get('/:apikey/webhdfs/openfile', Project.get.openFile);
app.get('/:apikey/webhdfs/homedir', Project.get.homeDir);
app.get('/:apikey/webhdfs/contentsummary', Project.get.contentSummary);
app.get('/:apikey/webhdfs/filechecksum', Project.get.filechecksum);

//post method
app.post('/:apikey/webhdfs/create', Project.post.createFile);
app.post('/:apikey/webhdfs/concat', Project.post.concat);
app.post('/:apikey/webhdfs/append', Project.post.append);

//put method
app.put('/:apikey/webhdfs/rename', Project.put.rename);
app.put('/:apikey/webhdfs/mkdir', Project.put.mkdir);
app.put('/:apikey/webhdfs/upload', Project.put.createWrite);
app.put('/:apikey/webhdfs/setpermission', Project.put.setPermission);
app.put('/:apikey/webhdfs/setowner', Project.put.setOwner);
app.put('/:apikey/webhdfs/setreplication', Project.put.setReplication);
app.put('/:apikey/webhdfs/settime', Project.put.setTimes);

//delete method
app.delete('/:apikey/webhdfs/delete', Project.delete.Delete);


var server = app.listen(port, host, function () {
  console.log("Server running at http://%s:%s", host, port);
})
