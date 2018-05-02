var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var yamlconfig = require('yaml-config');
var configYaml = yamlconfig.readConfig('../config/config.yml');

var host = configYaml.mapreduce_history.host;
var port = configYaml.mapreduce_history.port;
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
        info: function getListDatabase(req, res) {
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
                                            if (job_config[0].Configs[i].config_key == "mrhistory_host") {
                                                mrhistory_host = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "mrhistory_port") {
                                                mrhistory_port = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (mrhistory_host != null && mrhistory_port != null) {
                                            // GET http://<history server http address:port>/ws/v1/history/info
                                            var base = mrhistory_host+":"+mrhistory_port+"/ws/v1/history/info";

                                            var options = {
                                                uri: base,
                                                method: 'GET'
                                            }

                                            request(options, function(error, response, body) {
                                                if (error) {
                                                    console.log(error);
                                                    res.json(error);
                                                } else {
                                                    if (response.statusCode == 200) {
                                                        obj = JSON.parse(body);
                                                        res.json({
                                                            "err_code": 200,
                                                            "status": "OK",
                                                            "data": obj
                                                        });
                                                    } else {
                                                        console.log(response);
                                                        obj = JSON.parse(body);
                                                        res.json({
                                                            "err_code": response.statusCode,
                                                            "err_msg": "There was an error processing your request. Your request is "+response.request.uri.href
                                                        });
                                                    }

                                                }
                                            });

                                        } else {
                                            res.json({
                                                "err_code": 404,
                                                "err_msg": "Configuration cluster for MapReduce history is not found"
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
        },
        jobs: function getJobs(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;

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
                                       "err_msg": "Undefined Error"
                                   });
                               } else {
                                   var job_config = data;
                                   if (job_config.length > 0) {
                                       var projectName = data[0].Configs[0].config_value;

                                       for (var i = 0; i < job_config[0].Configs.length; i++) {
                                           if (job_config[0].Configs[i].config_key == "mrhistory_host") {
                                               mrhistory_host = job_config[0].Configs[i].config_value;
                                           }
                                           if (job_config[0].Configs[i].config_key == "mrhistory_port") {
                                               mrhistory_port = job_config[0].Configs[i].config_value;
                                           }
                                       }

                                       if (mrhistory_host != null && mrhistory_port != null) {
                                           // GET http://<history server http address:port>/ws/v1/history/mapreduce/jobs
                                           var base = mrhistory_host+":"+mrhistory_port+"/ws/v1/history/mapreduce/jobs";
                                           var options = {
                                               uri: base,
                                               method: 'GET'
                                           }

                                           request(options, function(error, response, body) {
                                               if (error) {
                                                   console.log(error);
                                                   res.json(error);
                                               } else {
                                                   if (response.statusCode == 200) {
                                                       obj = JSON.parse(body);
                                                       res.json({
                                                           "err_code": 200,
                                                           "status": "OK",
                                                           "data": obj
                                                       });
                                                   } else {
                                                       obj = JSON.parse(body);
                                                       res.json({
                                                           "err_code": response.statusCode,
                                                           "err_msg": response
                                                       });
                                                   }

                                               }
                                           });
                                       } else {
                                           res.json({
                                               "err_code": 404,
                                               "err_msg": "Configuration cluster for Map Reduce is not found"
                                           });
                                       }

                                   } else {
                                       res.json({
                                           "err_code": 404,
                                           "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                       });
                                   }
                               }
                           });
                       } else {
                           result2.err_code = 400;
                           res.json(result2);
                       }
                    });
                } else {
                    result.err_code = 400;
                    res.json(result);
                }
            });
        },
        job: function getJob(req,res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var jobid = req.params.jobid;

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
                                       "err_msg": "Undefined Error"
                                   });
                               } else {
                                   var job_config = data;
                                   if (job_config.length > 0) {
                                       var projectName = data[0].Configs[0].config_value;

                                       for (var i = 0; i < job_config[0].Configs.length; i++) {
                                           if (job_config[0].Configs[i].config_key == "mrhistory_host") {
                                               mrhistory_host = job_config[0].Configs[i].config_value;
                                           }
                                           if (job_config[0].Configs[i].config_key == "mrhistory_port") {
                                               mrhistory_port = job_config[0].Configs[i].config_value;
                                           }
                                       }

                                       if (mrhistory_host != null && mrhistory_port != null) {
                                           if (jobid == null) {
                                               res.json({
                                                   "err_code": 400,
                                                   "status": "BAD REQUEST",
                                                   "err_msg": "Job ID is empty"
                                               });
                                           } else {
                                               // GET http://<history server http address:port>/ws/v1/history/mapreduce/jobs/{job id}
                                               var base = mrhistory_host+":"+mrhistory_port+"/ws/v1/history/mapreduce/jobs/"+jobid;
                                               var options = {
                                                   uri: base,
                                                   method: 'GET'
                                               }

                                               request(options, function(error, response, body) {
                                                   if (error) {
                                                       console.log(error);
                                                       res.json({
                                                           "err_code": 500,
                                                           "err_msg": "Undefined Error. See console log for more details"
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
                                           }

                                       } else {
                                           res.json({
                                               "err_code": 404,
                                               "err_msg": "Configuration cluster for Map Reduce is not found"
                                           });
                                       }

                                   } else {
                                       res.json({
                                           "err_code": 404,
                                           "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                       });
                                   }
                               }
                           });
                       } else {
                           result2.err_code = 400;
                           res.json(result2);
                       }
                    });
                } else {
                    result.err_code = 400;
                    res.json(result);
                }
            });
        },
        jobAttempts: function getJobAttempts(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var jobid = req.params.jobid;

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
                                      "err_msg": "Undefined Error. See console log for more details"
                                  });
                              } else {
                                  var job_config = data;
                                  if (job_config.length > 0) {
                                      var projectName = data[0].Configs[0].config_value;

                                      for (var i = 0; i < job_config[0].Configs.length; i++) {
                                          if (job_config[0].Configs[i].config_key == "mrhistory_host") {
                                              mrhistory_host = job_config[0].Configs[i].config_value;
                                          }
                                          if (job_config[0].Configs[i].config_key == "mrhistory_port") {
                                              mrhistory_port = job_config[0].Configs[i].config_value;
                                          }
                                      }

                                      if (mrhistory_host != null && mrhistory_port != null) {
                                          if (jobid == null) {
                                              res.json({
                                                  "err_code": 400,
                                                  "err_msg": "Job ID is empty"
                                              });
                                          } else {
                                              // GET http://<history server http address:port>/ws/v1/history/mapreduce/jobs/job_1326381300833_2_2/jobattempts
                                              var base = mrhistory_host+":"+mrhistory_port+"/ws/v1/history/mapreduce/jobs/"+jobid+"/jobattempts";
                                              var options = {
                                                  uri: base,
                                                  method: 'GET'
                                              }

                                              request(options, function(error, response, body) {
                                                  if (error) {
                                                      console.log(error);
                                                      res.json({
                                                          "err_code": 500,
                                                          "err_msg": "Undefined Error. See console log for more details"
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
                                          }

                                      } else {
                                          res.json({
                                              "err_code": 404,
                                              "err_msg": "Configuration cluster for Map Reduce is not found"
                                          });
                                      }

                                  } else {
                                      res.json({
                                          "err_code": 404,
                                          "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                      });
                                  }
                              }
                          });
                      } else {
                        result2.err_code = 400;
                        res.json(result2);
                      }
                   });
               } else {
                   result.err_code = 400;
                   res.json(result);
               }
            });
        },
        jobCounters: function getJobCounters(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var jobid = req.params.jobid;

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
                                        "err_msg": "Undefined Error. See console log for more details"
                                    });
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        var projectName = data[0].Configs[0].config_value;

                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "mrhistory_host") {
                                                mrhistory_host = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "mrhistory_port") {
                                                mrhistory_port = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (mrhistory_host != null && mrhistory_port != null) {
                                            if (jobid == null) {
                                                res.json({
                                                    "err_code": 400,
                                                    "err_msg": "Job ID is empty"
                                                });
                                            } else {
                                                // GET http://<history server http address:port>/ws/v1/history/mapreduce/jobs/job_1326381300833_2_2/counters
                                                var base = mrhistory_host+":"+mrhistory_port+"/ws/v1/history/mapreduce/jobs/"+jobid+"/counters";
                                                var options = {
                                                    uri: base,
                                                    method: 'GET'
                                                }

                                                request(options, function(error, response, body) {
                                                    if (error) {
                                                        console.log(error);
                                                        res.json({
                                                            "err_code": 500,
                                                            "err_msg": "Undefined Error. See console log for more details"
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
                                            }

                                        } else {
                                            res.json({
                                                "err_code": 404,
                                                "err_msg": "Configuration cluster for Map Reduce is not found"
                                            });
                                        }

                                    } else {
                                        res.json({
                                            "err_code": 404,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                    }
                                }
                            });
                        } else {
                            result2.err_code = 400;
                            res.json(result2);
                        }
                    });
                } else {
                    result.err_code = 400;
                    res.json(result);
                }
            });
        },
        jobConf: function getJobConf(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var jobid = req.params.jobid;

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
                                        "err_msg": "Undefined Error. See console log for more details"
                                    });
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        var projectName = data[0].Configs[0].config_value;

                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "mrhistory_host") {
                                                mrhistory_host = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "mrhistory_port") {
                                                mrhistory_port = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (mrhistory_host != null && mrhistory_port != null) {
                                            if (jobid == null) {
                                                res.json({
                                                    "err_code": 400,
                                                    "err_msg": "Job ID is empty"
                                                });
                                            } else {
                                                // http://<history server http address:port>/ws/v1/history/mapreduce/jobs/{jobid}/conf
                                                var base = mrhistory_host+":"+mrhistory_port+"/ws/v1/history/mapreduce/jobs/"+jobid+"/conf";
                                                var options = {
                                                    uri: base,
                                                    method: 'GET'
                                                }

                                                request(options, function(error, response, body) {
                                                    if (error) {
                                                        console.log(error);
                                                        res.json({
                                                            "err_code": 500,
                                                            "err_msg": "Undefined Error. See console log for more details"
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
                                            }

                                        } else {
                                            res.json({
                                                "err_code": 404,
                                                "err_msg": "Configuration cluster for Map Reduce is not found"
                                            });
                                        }

                                    } else {
                                        res.json({
                                            "err_code": 404,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                    }
                                }
                            });
                        } else {
                            result2.err_code = 400;
                            res.json(result2);
                        }
                    });
                } else {
                    result.err_code = 400;
                    res.json(result);
                }
            });
        },
        jobTasks: function getJobTasks(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var jobid = req.params.jobid;

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
                                        "err_msg": "Undefined Error. See console log for more details"
                                    });
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        var projectName = data[0].Configs[0].config_value;

                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "mrhistory_host") {
                                                mrhistory_host = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "mrhistory_port") {
                                                mrhistory_port = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (mrhistory_host != null && mrhistory_port != null) {
                                            if (jobid == null) {
                                                res.json({
                                                    "err_code": 400,
                                                    "err_msg": "Job ID is empty"
                                                });
                                            } else {
                                                // http://<history server http address:port>/ws/v1/history/mapreduce/jobs/{jobid}/tasks
                                                var base = mrhistory_host+":"+mrhistory_port+"/ws/v1/history/mapreduce/jobs/"+jobid+"/tasks";
                                                var options = {
                                                    uri: base,
                                                    method: 'GET'
                                                }

                                                request(options, function(error, response, body) {
                                                    if (error) {
                                                        console.log(error);
                                                        res.json({
                                                            "err_code": 500,
                                                            "err_msg": "Undefined Error. See console log for more details"
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
                                            }

                                        } else {
                                            res.json({
                                                "err_code": 404,
                                                "err_msg": "Configuration cluster for Map Reduce is not found"
                                            });
                                        }

                                    } else {
                                        res.json({
                                            "err_code": 404,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                    }
                                }
                            });
                        } else {
                            result2.err_code = 400;
                            res.json(result2);
                        }
                    });
                } else {
                    result.err_code = 400;
                    res.json(result);
                }
            });
        },
        jobTask: function getJobTask(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var jobid = req.params.jobid;
            var taskid = req.params.taskid;

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
                                        "err_msg": "Undefined Error. See console log for more details"
                                    });
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        var projectName = data[0].Configs[0].config_value;

                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "mrhistory_host") {
                                                mrhistory_host = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "mrhistory_port") {
                                                mrhistory_port = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (mrhistory_host != null && mrhistory_port != null) {
                                            if (jobid == null) {
                                                res.json({
                                                    "err_code": 400,
                                                    "err_msg": "Job ID is empty"
                                                });
                                            } else {
                                                // http://<history server http address:port>/ws/v1/history/mapreduce/jobs/{jobid}/tasks/{taskid}
                                                var base = mrhistory_host+":"+mrhistory_port+"/ws/v1/history/mapreduce/jobs/"+jobid+"/tasks/"+taskid;
                                                var options = {
                                                    uri: base,
                                                    method: 'GET'
                                                }

                                                request(options, function(error, response, body) {
                                                    if (error) {
                                                        console.log(error);
                                                        res.json({
                                                            "err_code": 500,
                                                            "err_msg": "Undefined Error. See console log for more details"
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
                                            }

                                        } else {
                                            res.json({
                                                "err_code": 404,
                                                "err_msg": "Configuration cluster for Map Reduce is not found"
                                            });
                                        }

                                    } else {
                                        res.json({
                                            "err_code": 404,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                    }
                                }
                            });
                        } else {
                            result2.err_code = 400;
                            res.json(result2);
                        }
                    });
                } else {
                    result.err_code = 400;
                    res.json(result);
                }
            });
        },
        jobTaskCounters: function getTaskCounters(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var jobid = req.params.jobid;
            var taskid = req.params.taskid;

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
                                        "err_msg": "Undefined Error. See console log for more details"
                                    });
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        var projectName = data[0].Configs[0].config_value;

                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "mrhistory_host") {
                                                mrhistory_host = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "mrhistory_port") {
                                                mrhistory_port = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (mrhistory_host != null && mrhistory_port != null) {
                                            if (jobid == null) {
                                                res.json({
                                                    "err_code": 400,
                                                    "err_msg": "Job ID is empty"
                                                });
                                            } else {
                                                // http://<history server http address:port>/ws/v1/history/mapreduce/jobs/{jobid}/tasks/{taskid}/counters
                                                var base = mrhistory_host+":"+mrhistory_port+"/ws/v1/history/mapreduce/jobs/"+jobid+"/tasks/"+taskid+"/counters";
                                                var options = {
                                                    uri: base,
                                                    method: 'GET'
                                                }

                                                request(options, function(error, response, body) {
                                                    if (error) {
                                                        console.log(error);
                                                        res.json({
                                                            "err_code": 500,
                                                            "err_msg": "Undefined Error. See console log for more details"
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
                                            }

                                        } else {
                                            res.json({
                                                "err_code": 404,
                                                "err_msg": "Configuration cluster for Map Reduce is not found"
                                            });
                                        }

                                    } else {
                                        res.json({
                                            "err_code": 404,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                    }
                                }
                            });
                        } else {
                            result2.err_code = 400;
                            res.json(result2);
                        }
                    });
                } else {
                    result.err_code = 400;
                    res.json(result);
                }
            });
        },
        jobTaskAttempts: function getJobTaskAttempts(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var jobid = req.params.jobid;
            var taskid = req.params.taskid;

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
                                        "err_msg": "Undefined Error. See console log for more details"
                                    });
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        var projectName = data[0].Configs[0].config_value;

                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "mrhistory_host") {
                                                mrhistory_host = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "mrhistory_port") {
                                                mrhistory_port = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (mrhistory_host != null && mrhistory_port != null) {
                                            if (jobid == null) {
                                                res.json({
                                                    "err_code": 400,
                                                    "err_msg": "Job ID is empty"
                                                });
                                            } else {
                                                // http://<history server http address:port>/ws/v1/history/mapreduce/jobs/{jobid}/tasks/{taskid}/attempts
                                                var base = mrhistory_host+":"+mrhistory_port+"/ws/v1/history/mapreduce/jobs/"+jobid+"/tasks/"+taskid+"/attempts";
                                                var options = {
                                                    uri: base,
                                                    method: 'GET'
                                                }

                                                request(options, function(error, response, body) {
                                                    if (error) {
                                                        console.log(error);
                                                        res.json({
                                                            "err_code": 500,
                                                            "err_msg": "Undefined Error. See console log for more details"
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
                                            }

                                        } else {
                                            res.json({
                                                "err_code": 404,
                                                "err_msg": "Configuration cluster for Map Reduce is not found"
                                            });
                                        }

                                    } else {
                                        res.json({
                                            "err_code": 404,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                    }
                                }
                            });
                        } else {
                            result2.err_code = 400;
                            res.json(result2);
                        }
                    });
                } else {
                    result.err_code = 400;
                    res.json(result);
                }
            });
        },
        jobTaskAttempt: function getJobTaskAttempt(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var jobid = req.params.jobid;
            var taskid = req.params.taskid;
            var attemptid = req.params.attemptid;

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
                                        "err_msg": "Undefined Error. See console log for more details"
                                    });
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        var projectName = data[0].Configs[0].config_value;

                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "mrhistory_host") {
                                                mrhistory_host = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "mrhistory_port") {
                                                mrhistory_port = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (mrhistory_host != null && mrhistory_port != null) {
                                            if (jobid == null) {
                                                res.json({
                                                    "err_code": 400,
                                                    "err_msg": "Job ID is empty"
                                                });
                                            } else {
                                                // http://<history server http address:port>/ws/v1/history/mapreduce/jobs/{jobid}/tasks/{taskid}/attempts/{attemptid}
                                                var base = mrhistory_host+":"+mrhistory_port+"/ws/v1/history/mapreduce/jobs/"+jobid+"/tasks/"+taskid+"/attempts/"+attemptid;
                                                var options = {
                                                    uri: base,
                                                    method: 'GET'
                                                }

                                                request(options, function(error, response, body) {
                                                    if (error) {
                                                        console.log(error);
                                                        res.json({
                                                            "err_code": 500,
                                                            "err_msg": "Undefined Error. See console log for more details"
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
                                            }

                                        } else {
                                            res.json({
                                                "err_code": 404,
                                                "err_msg": "Configuration cluster for Map Reduce is not found"
                                            });
                                        }

                                    } else {
                                        res.json({
                                            "err_code": 404,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                    }
                                }
                            });
                        } else {
                            result2.err_code = 400;
                            res.json(result2);
                        }
                    });
                } else {
                    result.err_code = 400;
                    res.json(result);
                }
            });
        },
        jobTaskAttemptCounters: function getJobTaskAttemptCounter(req, res) {
            var ipAddres = req.connection.remoteAddress;
            var apikey = req.params.apikey;
            var ipAddresHeader = req.headers.api;
            var jobid = req.params.jobid;
            var taskid = req.params.taskid;
            var attemptid = req.params.attemptid;

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
                                        "err_msg": "Undefined Error. See console log for more details"
                                    });
                                } else {
                                    var job_config = data;
                                    if (job_config.length > 0) {
                                        var projectName = data[0].Configs[0].config_value;

                                        for (var i = 0; i < job_config[0].Configs.length; i++) {
                                            if (job_config[0].Configs[i].config_key == "mrhistory_host") {
                                                mrhistory_host = job_config[0].Configs[i].config_value;
                                            }
                                            if (job_config[0].Configs[i].config_key == "mrhistory_port") {
                                                mrhistory_port = job_config[0].Configs[i].config_value;
                                            }
                                        }

                                        if (mrhistory_host != null && mrhistory_port != null) {
                                            if (jobid == null) {
                                                res.json({
                                                    "err_code": 400,
                                                    "err_msg": "Job ID is empty"
                                                });
                                            } else {
                                                // http://<history server http address:port>/ws/v1/history/mapreduce/jobs/{jobid}/tasks/{taskid}/attempt/{attemptid}/counters
                                                var base = mrhistory_host+":"+mrhistory_port+"/ws/v1/history/mapreduce/jobs/"+jobid+"/tasks/"+taskid+"/attempts/"+attemptid+"/counters";
                                                var options = {
                                                    uri: base,
                                                    method: 'GET'
                                                }

                                                request(options, function(error, response, body) {
                                                    if (error) {
                                                        console.log(error);
                                                        res.json({
                                                            "err_code": 500,
                                                            "err_msg": "Undefined Error. See console log for more details"
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
                                            }

                                        } else {
                                            res.json({
                                                "err_code": 404,
                                                "err_msg": "Configuration cluster for Map Reduce is not found"
                                            });
                                        }

                                    } else {
                                        res.json({
                                            "err_code": 404,
                                            "err_msg": "Cluster Configuration is not found or user cluster is not set"
                                        });
                                    }
                                }
                            });
                        } else {
                            result2.err_code = 400;
                            res.json(result2);
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
                    "application": "Api Map Reduce",
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
app.get('/:apikey/mrhistory/info', Project.get.info);
app.get('/:apikey/mrhistory/jobs', Project.get.jobs);
app.get('/:apikey/mrhistory/jobs/:jobid', Project.get.job);
app.get('/:apikey/mrhistory/jobattempts/:jobid', Project.get.jobAttempts);
app.get('/:apikey/mrhistory/jobcounter/:jobid', Project.get.jobCounters);
app.get('/:apikey/mrhistory/jobconf/:jobid', Project.get.jobConf);
app.get('/:apikey/mrhistory/jobtask/:jobid', Project.get.jobTasks);
app.get('/:apikey/mrhistory/jobtask/:jobid/taskid/:taskid', Project.get.jobTask);
app.get('/:apikey/mrhistory/jobtask/:jobid/taskid/:taskid/counters', Project.get.jobTaskCounters);
app.get('/:apikey/mrhistory/jobtask/:jobid/taskid/:taskid/attempts', Project.get.jobTaskAttempts);
app.get('/:apikey/mrhistory/jobtask/:jobid/taskid/:taskid/attempts/:attemptid', Project.get.jobTaskAttempt);
app.get('/:apikey/mrhistory/jobtask/:jobid/taskid/:taskid/attempts/:attemptid/counters', Project.get.jobTaskAttemptCounters);


var server = app.listen(port, host, function () {
    console.log("Server running at http://%s:%s", host, port);
})
