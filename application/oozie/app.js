var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var yamlconfig = require('yaml-config');
var configYaml = yamlconfig.readConfig('../config/config.yml');
var Apiclient = require('apiclient');
var md5 = require('md5');
var XMLWriter = require('xml-writer');
var Hdfs = require('hdfs247');


var host = configYaml.baciro_oozie.host;
var port = configYaml.baciro_oozie.port;

//oozie
//submit job ke oozie
//var seedOozie = require("../config/seed_oozie.json");
var seedOozie =
{
			base: {
				protocol: 'http',
				pathname: '/oozie'
			},
			path: {
				GET: {
					get_oozie_info: {
							location: '/v1/job/%(ooziejob_id)s',
							query:{
								show: 'info',
								timezone: 'GMT'
							}
					},
					get_oozie_graph: {
							location: '/v1/job/%(ooziejob_id)s',
							query: {
								show:'graph'
							}
					},
					get_oozie_definition: {
							location: '/v1/job/%(ooziejob_id)s',
							query: {
								show:'definition'
							}
					},
					get_oozie_log: {
							location: '/v1/job/%(ooziejob_id)s',
							query: {
								show:'log'
							}
					},
					get_oozie_auditlog: {
							location: '/v2/job/%(ooziejob_id)s',
							query: {
								show:'auditlog'
							}
					},
					get_oozie_status: {
							location: '/v2/job/%(ooziejob_id)s',
							query: {
								show:'status'
							}
					},
					get_all_oozie: {
							location: '/v1/jobs'
					},
					success_all_oozie: {
							location: '/v2/jobs'
					},
					kill_all_oozie: {
							location: '/v1/jobs'
					},
					run_all_oozie: {
							location: '/v1/jobs'
					},
					suspend_all_oozie: {
							location: '/v1/jobs'
					},
					get_admin_configuration_oozie: {
							location: '/v2/admin/configuration'							
					},
					get_admin_status_oozie: {
							location: '/v2/admin/status'							
					},
					get_admin_osenv_oozie: {
							location: '/v2/admin/os-env'							
					},
					get_admin_javasysproperties_oozie: {
							location: '/v2/admin/java-sys-properties'							
					},
					get_admin_instrumentation_oozie: {
							location: '/v2/admin/instrumentation'							
					},
					get_admin_buildVersion_oozie: {
							location: '/v2/admin/build-version'							
					},
					get_admin_availabletimezones_oozie: {
							location: '/v2/admin/available-timezones'							
					},
					get_admin_servers_oozie: {
							location: '/v2/admin/available-oozie-servers'							
					},
					get_admin_sharelib_oozie: {
							location: '/v2/admin/list_sharelib'							
					}
					

				},
				POST: {
					oozie_job: {
							location: '/v1/jobs',
							query: {
								action:'start'
							}
						}


				}
			}
}

var seedYarn =
{
			base: {
				protocol: 'http',
				pathname: '/ws'
			},
			path: {
				GET: {
					get_yarn_info: {
							location: '/v1/cluster/apps/%(yarn_job_id)s'
					},
					get_all_yarn: {
							location: '/v1/cluster/apps'
					},
					cluster_info: {
							location: '/v1/cluster/info'
					},
					cluster_nodes: {
							location: '/v1/cluster/nodes'
					},
					cluster_metrics: {
							location: '/v1/cluster/metrics'
					},
					cluster_scheduler: {
							location: '/v1/cluster/scheduler'
					},
					cluster_appstatistics: {
							location: '/v1/cluster/appstatistics'
					},
					cluster_appattempts: {
							location: '/v1/cluster/apps/%(yarn_job_id)s/appattempts'
					},
					cluster_state: {
							location: '/v1/cluster/apps/%(yarn_job_id)s/state'
					},

				}
			}
}

//setting midleware
app.use (function(req,res,next){
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "DELETE, GET, POST, PUT, OPTIONS");
//  res.removeHeader("x-powered-by");
  next();
});

//ORM
var Database = require("../mysql/Mysql.js");
var Api_user = Database('User');
var Api_cluster = Database('Cluster');
var Api_job = Database('Job');
var Api_project = Database('Project');
var Api_application = Database('Application');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

var Phoenix = {


}

var Oozie = {

    getHistoryOozie: function getProjectJobHistory(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var project_id = req.params.project_id

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
                //proses query ambil data user
                if(typeof project_id !== 'undefined'){
					Api_project.findJoin({"project_id": project_id},{Job : "job_project_id"},function(err,data){						
                      if(err){
                        res.json(err);
                      }else{
                            //cek jumdata dulu
                            if(data.length > 0){
								if(data[0].Jobs.length>0){
									var dataJob = [];
									for(key in data[0].Jobs){
										dataJob[key] = {};
										data[0].Jobs[key].job_create_date = data[0].Jobs[key].job_create_date.slice(0,19).replace('T',' ');
										if(data[0].Jobs[key].job_update_date!==null)
											data[0].Jobs[key].job_update_date = data[0].Jobs[key].job_update_date.slice(0,19).replace('T',' ');
										else
											data[0].Jobs[key].job_update_date="null";
											dataJob[key].job_id = data[0].Jobs[key].oozie_job_id;
											dataJob[key].job_name = data[0].Jobs[key].job_name;
											dataJob[key].job_status = data[0].Jobs[key].job_status;
											dataJob[key].job_create_date = data[0].Jobs[key].job_create_date;
											dataJob[key].job_update_date = data[0].Jobs[key].job_update_date;
											dataJob[key].job_workflow = data[0].Jobs[key].job_workflow;
											dataJob[key].project_id = data[0].Jobs[key].job_project_id;
											dataJob[key].user_id = data[0].Jobs[key].user_id;
										}
	                                res.json({"err_code": 0, "data": dataJob});
								}else{
									res.json({"err_code": 2, "err_msg": "History data is not found", "application": "Api Baciro Oozie", "function": "getProjectJobHistory"});
								}
                            }else{
                                res.json({"err_code": 2, "err_msg": "Project ID is not found"});
                            }               
                      }
                    });
                }else{
                    res.json({"err_code": 3, "err_msg": "Project ID is not defined", "application": "Api Baciro Oozie", "function": "getProjectJobHistory"});
                }
            }else{
                res.json({"err_code": 4, "err_msg": "API Key is invalid", "application": "Api Baciro Oozie", "function": "getProjectJobHistory"});
            }
        });
    },
		getxml: function getXml(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;

				var jarName = req.body.submit_jar_path;
				var jobName = req.body.submit_job_name;
				var className = req.body.submit_class_name;
				var projectId = req.body.submit_project_id;
				if(req.body.args === undefined){
          var argumenInput = "";
          var argumenOutput = "";
          var argumenOthers = "";
        }else{
          var argumenInput = req.body.args.input;
					if(req.body.args.output===undefined){
						var argumenOutput = "";
					}else{
						var argumenOutput = req.body.args.output;
					}

					if(req.body.args.others===undefined){
						var argumenOthers = "";
					}else{
						var argumenOthers = req.body.args.others;
					}
        }

				if(projectId == undefined || jarName == undefined || jobName == undefined || className ==undefined) {
					res.json({"err_code":11, "err_msg":"Body Parameter is Invalid"});
				} else {
        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
                //proses query ambil data user
								getUserByApikey(apikey, function(result2){
                if(result2.err_code == 0){
                //ambil cluster_id
                var cluster_id = result2.user_cluster_id;
								var user_id = result2.user_id;
								//var user_id = result2.user_user_id;
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){
								//ApiPhoenix.get('cluster_configs', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {
                    if(err){
                        res.json(err);
                    }else{
                        var job_config = data; //object

                        //cek apakah ada error atau tidak
                        //if(job_config.err_code == 0){
                            //cek jumdata dulu
	                        if(data.length > 0){
														if(job_config[0].cluster_status == 'active' || job_config[0].cluster_status == 'default'){
															var usernameOozie, nameNode, jobTracker, queueName, useSystemLibpath, oozieLibpath;
															Api_project.findWhereAnd([{"project_id":projectId},{"project_user_id":user_id}],function(err,data){
															//ApiPhoenix.get('projectByUser', {"apikey": apikey, "project_id":projectId, "user_id":user_id}, {}, function(error, response, body){
																if(err){
																	res.json(err);
																}else{

																//var userProject = JSON.parse(body); //object
																//cek apakah ada error atau tidak
																//if(userProject.err_code == 0){
																	//cek jumdata dulu
																	if(data.length > 0){
																		var projectName = data[0].project_name;

																		for(var i = 0; i < job_config[0].Configs.length; i++){
																				switch(job_config[0].Configs[i].config_key){
																				case 'usernameOozie':
																						usernameOozie = job_config[0].Configs[i].config_value; //dari user_id, kalau di workflow wf:user
																						break;
																				case 'jobTracker':
																						jobTracker = job_config[0].Configs[i].config_value;
																						break;
																				case 'nameNode':
																						nameNode = job_config[0].Configs[i].config_value;
																						break;
																				// case 'examplesRoot':
																				// 		examplesRoot = job_config.data[i].config_value;
																				// 		break;
																				case 'queueName':
																						queueName = job_config[0].Configs[i].config_value;
																						break;
																				// case 'oozieWfPath':
																				// 		oozieWfPath = job_config.data[i].config_value;
																				// 		break;
																				case 'useSystemLibpath':
																						useSystemLibpath = job_config[0].Configs[i].config_value;
																						break;
																				case 'oozieLibpath':
																						oozieLibpath = job_config[0].Configs[i].config_value;
																						break;
																				}
																		}

																			var wfPath = '${nameNode}/user/' + usernameOozie + '/jobfile/workflow/' + projectName + '/workflow.xml';
																			if(usernameOozie == undefined || nameNode == undefined || jobTracker == undefined || queueName == undefined || useSystemLibpath == undefined || oozieLibpath == undefined || wfPath == undefined) {
																				res.json({"err_code": 1, "err_msg":"Configuration parameter is undefined"})
																			}else {
																				var xml = generateXml(usernameOozie, nameNode, jobTracker, queueName, useSystemLibpath, oozieLibpath, wfPath);
																				console.log("Success generate XML Job Property");
																			}

			                                var workflow = generateWorkflow(jarName, jobName, className, argumenInput, argumenOutput, argumenOthers, queueName);
																			console.log("Success generate XML Workflow");

			                                res.set('Content-Type', 'application/json');
			                                res.send({"err_code": 0, "data":{ "xml":xml.output, "workflow":workflow.output }});
			                                //console.log(xml.output);
																		}else{
																			res.json({"err_code": 4, "err_msg": "Access denied. Cannot Access this project"});
																		}
																	// }else{
																	// 	res.json({"err_code": 3, "err_msg": user.error, "application": "Api Baciro Oozie", "function": "getProjectByUser"});
																	// }
																}
															});//getProjectByUser
														}else{
															res.json({"err_code": 3, "err_msg": "Job Configuration is not active"});
														}
													}else{
                              res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                          }
	                      // }else{
	                      //     res.json({"err_code": 1, "err_msg": job_config.error, "application": "Api Baciro Oozie", "function": "getXml"});
                        // }
                    }//else
									});
							}else{
								result.err_code = 500;
								res.json(result2);//getclusterfromapikey
							}
						});
          }else{
              result.err_code = 500;
              res.json(result);//apikey
          }
        });
			}
    },
    getjobid: function getJobId(req, res){
      var ipAddres = req.connection.remoteAddress;
      var apikey = req.params.apikey;
      var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

      checkApikey(apikey, ipAddres, function(result){
        if(result.err_code == 0){
          getUserByApikey(apikey, function(result2){
        	if(result2.err_code == 0){
				// res.json(result2);
          		var user_id = result2.user_id;
          		//proses query ambil data user
          		if(typeof user_id !== 'undefined'){         			
					Api_job.findById({"user_id": user_id},function(err,data){										
					// res.json(data);
              		if(err){
                		res.json(err);
              		}else{              	              			
	                //cek jumdata dulu
	                	if(data.length > 0){
										var oozie_data = [];
										for(key in data){
											oozie_data[key] = {
												"oozie_job_id" : data[key].oozie_job_id,
												"oozie_create_date": data[key].job_create_date,
												"oozie_update_date" : data[key].job_update_date,
												"oozie_status" : data[key].job_status												
											};
											oozie_data[key].oozie_create_date = data[key].job_create_date.slice(0,19).replace('T',' ');
									  		if(oozie_data[key].oozie_update_date!==null)
												oozie_data[key].oozie_update_date = data[key].job_update_date.slice(0,19).replace('T',' ');
											else
											oozie_data[key].oozie_update_date = "null";
										}																					
										res.json({"err_code": 0, "data": oozie_data});
										
                  		}else{
                    		res.json({"err_code": 2, "err_msg": "No job found for this user"});
                  		}                
              }
            });
          }
          }else{
            result.err_code = 500;
            res.json(result2);//getclusterfromapikey
          }
        });
        }else{
          result.err_code = 500;
          res.json(result);
        }
      });

    },

    post: function submitJob(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;

				var projectId = req.body.submit_project_id;
				var jarName = req.body.submit_jar_path;
				var jobName = req.body.submit_job_name;
				var className = req.body.submit_class_name;
				if(req.body.args === undefined){
          var argumenInput = "";
          var argumenOutput = "";
          var argumenOthers = "";
        }else{
          var argumenInput = req.body.args.input;
					if(req.body.args.output===undefined){
						var argumenOutput = "";
					}else{
						var argumenOutput = req.body.args.output;
					}

					if(req.body.args.others===undefined){
						var argumenOthers = "";
					}else{
						var argumenOthers = req.body.args.others;
					}
        }

				if(projectId == undefined || jarName == undefined || jobName == undefined || className ==undefined) {
					res.json({"err_code":11, "err_msg":"Body Parameter is Invalid"});
				}else{
					var ipAddresHeader = req.headers.api;
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }
        //cek API user
        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
                //variabel untuk upload workflow ke hdfs
                var hostnameHdfs, portHdfs, usernameHdfs;

                getUserByApikey(apikey, function(result2){
                  if(result2.err_code == 0){
                    //ambil cluster_id
                    var cluster_id = result2.user_cluster_id;
    				var user_id = result2.user_id;
                    //proses simpan data user
                    //method, endpoint, params, options, callback
						Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){
		                  if(err){
		                      res.json(err);
		                  }else{                                     
                              var job_config = data; //object
  		                            //cek jumdata dulu
  		                          if(job_config.length > 0){
  										//rest untuk ambil data project name dari project id
										Api_project.findWhereAnd([{"project_id":projectId},{"project_user_id":user_id}],function(err,data){
											if(err){
												res.json(err);
											}else{
												//cek apakah ada error atau tidak
												//cek jumdata dulu
												if(data.length > 0){
														var projectName = data[0].project_name;
														//rest untuk mengambil info job dari response yang diperoleh
  					                                var usernameOozie, nameNode, /*examplesRoot,*/ jobTracker, queueName, useSystemLibpath, oozieLibpath;
  					                                for(var i = 0; i < job_config[0].Configs.length; i++){
  					                                    switch(job_config[0].Configs[i].config_key){
  					                                    case 'usernameOozie':
  					                                        usernameOozie = job_config[0].Configs[i].config_value; //dari user_id, kalau di workflow wf:user
  					                                        break;
  					                                    case 'jobTracker':
  					                                        jobTracker = job_config[0].Configs[i].config_value;
  					                                        break;
  					                                    case 'nameNode':
  					                                        nameNode = job_config[0].Configs[i].config_value;
  					                                        break;
  					                                    // case 'examplesRoot':
  					                                    //     examplesRoot = job_config.data[i].config_value;
  					                                    //     break;
  					                                    case 'queueName':
  					                                        queueName = job_config[0].Configs[i].config_value;
  					                                        break;
  					                                    case 'useSystemLibpath':
  					                                        useSystemLibpath = job_config[0].Configs[i].config_value;
  					                                        break;
  					                                    case 'oozieLibpath':
  					                                        oozieLibpath = job_config[0].Configs[i].config_value;
  					                                        break;

  					                                    //untuk seedOozie
  					                                    case 'hostnameOozie':
  					                                        seedOozie.base.hostname = job_config[0].Configs[i].config_value;
  					                                        break;
  					                                    case 'portOozie':
  					                                        seedOozie.base.port = job_config[0].Configs[i].config_value;
  					                                        break;

  			                                            //untuk hdfs
  					                                    case 'hostnameHdfs':
  					                                        hostnameHdfs = job_config[0].Configs[i].config_value;
  					                                        break;
  					                                    case 'portHdfs':
  					                                        portHdfs = job_config[0].Configs[i].config_value;
  					                                        break;
  	                                            		case 'usernameHdfs':
		  	                                                usernameHdfs = job_config[0].Configs[i].config_value;
		  	                                                break;
  					                                    }
  					                                }
  			                                        var wfPath = '${nameNode}/user/' + usernameOozie + '/jobfile/workflow/' + projectName + '/workflow.xml';
														console.log(usernameOozie);
														if(usernameOozie == undefined || nameNode == undefined || jobTracker == undefined || queueName == undefined || useSystemLibpath == undefined || oozieLibpath == undefined || wfPath == undefined) {
															res.json({"err_code": 9, "err_msg":"Parameter from Config is undefined"});
														}else {
															var xml = generateXml(usernameOozie, nameNode, jobTracker, queueName, useSystemLibpath, oozieLibpath, wfPath);
															console.log("Success generate XML Job Property");
														}

  			                                        try{
  			                                            //Generate workflow.xml file
  			                                            var workflow = generateWorkflow(jarName, jobName, className, argumenInput,argumenOutput,argumenOthers, queueName);
  					                                    		var pathFile = __dirname + '/workflow_xml/workflow.xml';
  			                                            fs.writeFile(pathFile, workflow, function(error) {
  			                                                if (error) {
  			                                                    console.error("write error:  " + error.message);
  			                                                 } else {
  			                                                    console.log("Success Write Workflow.xml to " + pathFile+"\nNext is upload to HDFS");
  			                                                }
  			                                            });

  			                                            //HDFS property initialization
  			                                            var pathFile = __dirname + '/workflow_xml/workflow.xml';
  			                                            var hdfs = new Hdfs({
  			                                                      protocol:'http',
  			                                                      hostname:hostnameHdfs,
  			                                                      port:portHdfs
  			                                                       });

  			                                            var params = {
  			                                                'user.name': usernameHdfs,
  			                                                path: '/user/' + usernameOozie + '/jobfile/workflow/' + projectName
  			                                            };

  			                                            hdfs.liststatus(params, function(error, response, body){
  			                                                var obj1 = JSON.parse(body);
  			                                                var path = '/user/' + usernameOozie + '/jobfile/workflow/' + projectName;
  			                                                if(obj1.FileStatuses !== undefined){
  			                                                    hdfs.upload({
  			                                                         'user.name':usernameHdfs,
  			                                                         overwrite:true,
  			                                                         localpath:pathFile,
  			                                                         path: path + '/workflow.xml'
  			                                                     }, function(error, response, body){
  			                                                         if(error){
  			                                                                console.log(error);
																																				res.json({"err_code":5, "err_msg":"Could not upload to HDFS"});
  			                                                          }else{
  			                                                                console.log("Workflow.xml is succesfully uploaded to HDFS");
  			                                                                var ApiOozie = new Apiclient(seedOozie);
																																				console.log(xml);
  			                                                                ApiOozie.post('oozie_job', {}, {body:xml.output, headers: {'Content-Type': 'application/xml'}}, function(error, response, body){
  			                                                                    if(error){
  			                                                                        console.log("Error while posting to Oozie");
  			                                                                        res.json({"err_code": 8, "err_msg": "Error while posting to Oozie", "application": "Api Baciro Oozie", "function": "submitJob"});
  			                                                                    }else{
  			                                                                        console.log("Success posting Job to Oozie");
  			                                                                        //res.send(body);
  			                                                                        var jobBody = JSON.parse(body);
  			                                                                        //rest untuk mengambil info job dari response yang diperoleh
  			                                                                        ApiOozie.get('get_oozie_info', {"ooziejob_id": jobBody.id}, {}, function(error, response, body){
  			                                                                            if(error){
  			                                                                                res.json(error);
  			                                                                            }else{
  			                                                                                var job_info = JSON.parse(body); //object
  			                                                                                //sini buat ngambil dari tabel Job
  			                                                                                var dataJob = {
  			                                                                                    "oozie_job_id":job_info.id,
  			                                                                                    "job_name":job_info.appName,
  			                                                                                    "job_status":job_info.status,
  			                                                                                    "job_project_id":projectId,
  			                                                                                    "application_job_id":0,
  			                                                                                    "job_create_date": getFormattedDate(),
  			                                                                                    "job_update_date": getFormattedDate(),
  			                                                                                    "user_id":user_id,
  			                                                                                    "job_workflow": workflow.output
  			                                                                                };
																								Api_job.add(dataJob,function(err,data){  			                                                                                    if(err){
  			                                                                                        console.log("Error while Saving Job Info to DB");
  			                                                                                        res.json({"err_code": 7, "err_msg": "Error while Saving Job Info to Database", "application": "Api Baciro Oozie", "function": "job"});
  			                                                                                    }else{
  			                                                                                        console.log("Success Saving Job Info to DB");
  			                                                                                        res.json({"err_code": 0, "data": {"oozie_job_id":job_info.id, "job_status":job_info.status}});
  			                                                                                    }
  			                                                                                });
  			                                                                            }
  			                                                                        });
  			                                                                    }
  			                                                                });
  			                                                          }
  			                                                     });
  			                                                }else if(obj1.RemoteException.message === 'File ' + path + ' does not exist.'){
  			                                                    hdfs.mkdirs(params, function(error, response, body){
  			                                                            var obj2 = JSON.parse(body);
  			                                                            if(obj2.boolean == true){
  			                                                                console.log('Directory is created');
  			                                                                //after directory is created, upload workflow.xml to the directory
  			                                                                 hdfs.upload({
  			                                                                     'user.name':usernameHdfs,
  			                                                                     overwrite:true,
  			                                                                     localpath:pathFile,
  			                                                                     path: path + '/workflow.xml'
  			                                                                 }, function(error, response, body){
  			                                                                     //var obj3 = JSON.parse(body);
  			                                                                     if(error){
  			                                                                         console.log(error);
																						res.json({"err_code":9, "err_msg":"Could not upload to HDFS"});
  			                                                                     }else{
  			                                                                         console.log("Workflow.xml is succesfully uploaded to HDFS");
  			                                                                         //function call, posting job to oozie  			                                                                        
  			                                                                        var ApiOozie = new Apiclient(seedOozie);
  			                                                                        ApiOozie.post('oozie_job', {}, {body:xml.output, headers: {'Content-Type': 'application/xml'}}, function(error, response, body){
  			                                                                            if(error){
  			                                                                                console.log("Error while posting to Oozie");
  			                                                                                res.json({"err_code": 8, "err_msg": "Error while posting to Oozie", "application": "Api Baciro Oozie", "function": "submitJob"});
  			                                                                            }else{
  			                                                                                console.log("Success posting Job to Oozie");
  			                                                                                //res.send(body);
  			                                                                                var jobBody = JSON.parse(body);
  			                                                                                //rest untuk mengambil info job dari response yang diperoleh
  			                                                                                ApiOozie.get('get_oozie_info', {"ooziejob_id": jobBody.id}, {}, function(error, response, body){
  			                                                                                    if(error){
  			                                                                                        res.json(error);
  			                                                                                    }else{
  			                                                                                        var job_info = JSON.parse(body); //object
  			                                                                                        //sini buat ngambil dari tabel Job
  			                                                                                        var dataJob = {
  			                                                                                            "oozie_job_id":job_info.id,
  			                                                                                            "job_name":job_info.appName,
  			                                                                                            "job_status":job_info.status,
  			                                                                                            "job_project_id":projectId,
  			                                                                                            "application_job_id":0,
  			                                                                                            "job_create_date": getFormattedDate(),
  			                                                                                            "job_update_date": getFormattedDate(),
  			                                                                                            "user_id":user_id,
  			                                                                                            "job_workflow": workflow.output
  			                                                                                        };
																									Api_job.add(dataJob,function(err,data){
  			                                                                                            if(err){
  			                                                                                                console.log("Error while Saving Job Info to DB");
  			                                                                                                res.json({"err_code": 7, "err_msg": "Error while Saving Job Info to Database", "application": "Api Baciro Oozie", "function": "job"});
  			                                                                                            }else{
  			                                                                                                console.log("Success Saving Job Info to DB");
  			                                                                                                res.json({"err_code": 0, "data": {"oozie_job_id":job_info.id, "job_status":job_info.status}});
  			                                                                                            }
  			                                                                                        });
  			                                                                                    }
  			                                                                                });
  			                                                                            }
  			                                                                        });
  			                                                                     }
  			                                                                 });
  			                                                            }else{
  			                                                                console.log('Directori is already exist');
  			                                                            }
  			                                                    });
  			                                                }else{
  			                                                    console.log('Directory is exist');
  			                                                }
  			                                            });
  			                                        }
  			                                        catch(err){
  			                                            console.log('Error found!');
  			                                            console.log(err);
														es.json({"err_code":5, "err_msg":err});
  			                                        }
  			                                        //method, endpoint, params, options, callback
  					                            }else{
													res.json({"err_code": 4, "err_msg": "Access denied. Cannot access this project"});
												}  																		
  											}
  										});//getProjectByUser
									}else{
										res.json({"err_code": 2, "err_msg": "Cluster Configuration is not found or user cluster is not set"});
									}  		                        
								}
			                });
	                  }else{
	                    result.err_code = 500;
	                    res.json(result2);
	                  }
	               });
	            }else{
					res.json(result);
				}
	        });
		}
    },

    //oozie job id & all
    getOozieJob: function OozieJob(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
                getUserByApikey(apikey, function(result2){
                    if(result2.err_code == 0){
                    //ambil cluster_id
                        var cluster_id = result2.user_cluster_id;
                        var ooziejob_id = req.params.ooziejob_id;
                        //proses query ambil data user
                        if(typeof ooziejob_id !== 'undefined' ){
							Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
                                if(err){
                                    res.json(err);
                                }else{
                                    var job_config = data[0].Configs;                  
                                    //cek jumdata dulu									
									if(job_config.length > 0){
                                        for(var i = 0; i < job_config.length; i++){
                                            switch(job_config[i].config_key){
                                            case 'hostnameOozie':
                                                seedOozie.base.hostname = job_config[i].config_value;
                                                break;
                                            case 'portOozie':
                                                seedOozie.base.port = job_config[i].config_value;
                                                break;
                                            }
                                        }
                                        checkOozieJob(ooziejob_id, function(result3){
                                        	if (result3.err_code==0) {
                                       			//method, endpoint, params, options, callback
	                                            var ApiOozie = new Apiclient(seedOozie);
												ApiOozie.get('get_oozie_info', {"apikey": apikey, "ooziejob_id": ooziejob_id, "cluster_id": cluster_id}, {}, function (error, response, body) {																																																		
													if(error){													
	                                                    res.json(error);
	                                                }else{
														if(body.length>0) {
															var job_info = JSON.parse(body);																	
															var yarn = job_info.actions[1].consoleUrl;
		                                                    var spliter = yarn.split("http://yava-177.solusi247.com:8088/proxy/");	
		                                                    var spliter2 = 	spliter[1].replace('/', '');			                                                    
															var data_sent = {
		                                                            "oozie_job_id":job_info.id,
		                                                            "job_status":job_info.status,
		             												"yarn_job_id" : spliter2,	
                                                        			"job_update_date":getFormattedDate()
		                                                        };		
		                                                        // res.json(data_sent);		                                                        
															Api_job.update({"oozie_job_id": ooziejob_id},data_sent,function(err,data){
															// res.json(data);
																if(err){
																	console.log("Error Saving Status Update");
																	res.json({"err_code": 1, "err_msg": err, "application": "Api Baciro Oozie", "function": "job"});
																}else{
			                                                        console.log("Success Saving Status Update");
			                                                        res.json({"err_code": 0, "data": job_info});
			                                                    }
			                                                        });
														}else{
															res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
	                                              		}
													}
	                                            });
                                        	}else{
                                        		res.json({"err_code":2,"err_msg":"Job Id is not found"});
                                        	}
                                        });
                                    }else{
                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                                    }                                    
                               	}
                            });
                        }else{
                        	Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){		
							// res.json(data);
                                if(err){
                                    res.json(err);
                                }else{
                                    var job_config = data[0].Configs; //object                   
                                        //cek jumdata dulu
										console.log(job_config);
										if(job_config.length > 0){
                                            for(var i = 0; i < job_config.length; i++){
                                                switch(job_config[i].config_key){
                                                case 'hostnameOozie':
                                                    seedOozie.base.hostname = job_config[i].config_value;
                                                    break;
                                                case 'portOozie':
                                                    seedOozie.base.port = job_config[i].config_value;
                                                    break;
                                                }
                                            }
		                                            var ApiOozie = new Apiclient(seedOozie);
													ApiOozie.get('get_all_oozie', {"apikey": apikey}, {}, function (error, response, body) {							
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																var job_all = JSON.parse(body);								
																res.json({"err_code": 0, "data": job_all});								

															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
                                        }else{
                                            res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                                        }                                    
                                }
                            });
                        }									       
		            }else{
		                result.err_code = 500;
		                res.json(result);
		            }
        		});
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //
    //oozie status SUCCEEDED
    SuccessAllOozie: function OozieSuccessJob(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
                getUserByApikey(apikey, function(result2){
                    if(result2.err_code == 0){
                    //ambil cluster_id
                        var cluster_id = result2.user_cluster_id;
                        var ooziejob_id = req.params.ooziejob_id;
                        //proses query ambil data user
                        	Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){		
							// res.json(data);
                                if(err){
                                    res.json(err);
                                }else{
                                    var job_config = data[0].Configs; //object                   
                                        //cek jumdata dulu
										console.log(job_config);
										if(job_config.length > 0){
                                            for(var i = 0; i < job_config.length; i++){
                                                switch(job_config[i].config_key){
                                                case 'hostnameOozie':
                                                    seedOozie.base.hostname = job_config[i].config_value;
                                                    break;
                                                case 'portOozie':
                                                    seedOozie.base.port = job_config[i].config_value;
                                                    break;
                                                }
                                            }
                                            debugger;
		                                            var ApiOozie = new Apiclient(seedOozie);
													ApiOozie.get('success_all_oozie', {"apikey": apikey}, {}, function (error, response, body) {							
														debugger;														
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																var job_all = JSON.parse(body);								
																res.json({"err_code": 0, "data": job_all});								

															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
                                        }else{
                                            res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                                        }                                    
                                }
                            });                        							      
		            }else{
		                result.err_code = 500;
		                res.json(result);
		            }
        		});
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },


    // oozie Graph
    getOozieGraph: function OozieGraph(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
                getUserByApikey(apikey, function(result2){
                    if(result2.err_code == 0){
                    //ambil cluster_id
                        var cluster_id = result2.user_cluster_id;
                        var ooziejob_id = req.params.ooziejob_id;
                        //proses query ambil data user
							Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
                                if(err){
                                    res.json(err);
                                }else{
                                    var job_config = data[0].Configs;                  
                                    //cek jumdata dulu									
									if(job_config.length > 0){
                                        for(var i = 0; i < job_config.length; i++){
                                            switch(job_config[i].config_key){
                                            case 'hostnameOozie':
                                                seedOozie.base.hostname = job_config[i].config_value;
                                                break;
                                            case 'portOozie':
                                                seedOozie.base.port = job_config[i].config_value;
                                                break;
                                            }
                                        }
                                        checkOozieJob(ooziejob_id, function(result3){
                                        	if (result3.err_code==0) {
                                        		console.log("MASUK . . .");
                                       			//method, endpoint, params, options, callback
	                                            var ApiOozie = new Apiclient(seedOozie);
												ApiOozie.get('get_oozie_graph', {"apikey": apikey, "ooziejob_id": ooziejob_id, "cluster_id": cluster_id}, {}, function (error, response, body) {
													// console.log (body);
													console.log("MASUK LAGI. . .");	
													// var output = body;
													res.header('Content-Type' ,'image/png');
													res.header('Content-Type', 'application/octet-stream');													
													res.end(body, 'binary');												
													// res.type('png');
													// res.send(body);			             
												// res.json(info);																																																		
													if(error){													
	                                                    res.json(error);
	                                                }else{
														if(body.length>0) {

														}else{
															res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
	                                              		}
													}
	                                            });
                                        	}else{
                                        		console.log("TIDAK MASUK . . . ");
                                        		res.json({"err_code":2,"err_msg":"Job Id is not found"});
                                        	}
                                        });
                                    }else{
                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                                    }                                    
                               	}
                            });
								       
		            }else{
		                result.err_code = 500;
		                res.json(result);
		            }
        		});
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //
    // oozie Definition
    getOozieDefinition: function OozieDefinition(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
                getUserByApikey(apikey, function(result2){
                    if(result2.err_code == 0){
                    //ambil cluster_id
                        var cluster_id = result2.user_cluster_id;
                        var ooziejob_id = req.params.ooziejob_id;
                        //proses query ambil data user
							Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
                                if(err){
                                    res.json(err);
                                }else{
                                    var job_config = data[0].Configs;                  
                                    //cek jumdata dulu									
									if(job_config.length > 0){
                                        for(var i = 0; i < job_config.length; i++){
                                            switch(job_config[i].config_key){
                                            case 'hostnameOozie':
                                                seedOozie.base.hostname = job_config[i].config_value;
                                                break;
                                            case 'portOozie':
                                                seedOozie.base.port = job_config[i].config_value;
                                                break;
                                            }
                                        }
                                        checkOozieJob(ooziejob_id, function(result3){
                                        	if (result3.err_code==0) {
                                        		console.log("MASUK . . .");
                                       			//method, endpoint, params, options, callback
	                                            var ApiOozie = new Apiclient(seedOozie);
												ApiOozie.get('get_oozie_definition', {"apikey": apikey, "ooziejob_id": ooziejob_id, "cluster_id": cluster_id}, {}, function (error, response, body) {													
													if(error){													
	                                                    res.json(error);
	                                                }else{
														if(body.length>0) {
															console.log("MASUK LAGI. . .");	
															res.set('Content-Type', 'application/xml');													
															res.send(body);												
														}else{
															res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
	                                              		}
													}
	                                            });
                                        	}else{
                                        		console.log("TIDAK MASUK . . . ");
                                        		res.json({"err_code":2,"err_msg":"Job Id is not found"});
                                        	}
                                        });
                                    }else{
                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                                    }                                    
                               	}
                            });
								       
		            }else{
		                result.err_code = 500;
		                res.json(result);
		            }
        		});
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //
    // oozie Log
    getOozieLog: function OozieLog(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
                getUserByApikey(apikey, function(result2){
                    if(result2.err_code == 0){
                    //ambil cluster_id
                        var cluster_id = result2.user_cluster_id;
                        var ooziejob_id = req.params.ooziejob_id;
                        //proses query ambil data user
							Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
                                if(err){
                                    res.json(err);
                                }else{
                                    var job_config = data[0].Configs;                  
                                    //cek jumdata dulu									
									if(job_config.length > 0){
                                        for(var i = 0; i < job_config.length; i++){
                                            switch(job_config[i].config_key){
                                            case 'hostnameOozie':
                                                seedOozie.base.hostname = job_config[i].config_value;
                                                break;
                                            case 'portOozie':
                                                seedOozie.base.port = job_config[i].config_value;
                                                break;
                                            }
                                        }
                                        checkOozieJob(ooziejob_id, function(result3){
                                        	if (result3.err_code==0) {
                                        		console.log("MASUK . . .");
                                       			//method, endpoint, params, options, callback
	                                            var ApiOozie = new Apiclient(seedOozie);
												ApiOozie.get('get_oozie_log', {"apikey": apikey, "ooziejob_id": ooziejob_id, "cluster_id": cluster_id}, {}, function (error, response, body) {													
													if(error){													
	                                                    res.json(error);
	                                                }else{
														if(body.length>0) {
															console.log("MASUK LAGI. . .");	
															res.set('Content-Type', 'text/plain');													
															res.send(body);												
														}else{
															res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
	                                              		}
													}
	                                            });
                                        	}else{
                                        		console.log("TIDAK MASUK . . . ");
                                        		res.json({"err_code":2,"err_msg":"Job Id is not found"});
                                        	}
                                        });
                                    }else{
                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                                    }                                    
                               	}
                            });
								       
		            }else{
		                result.err_code = 500;
		                res.json(result);
		            }
        		});
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //
    // oozie audit Log
    getOozieAuditLog: function OozieAuditLog(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
                getUserByApikey(apikey, function(result2){
                    if(result2.err_code == 0){
                    //ambil cluster_id
                        var cluster_id = result2.user_cluster_id;
                        var ooziejob_id = req.params.ooziejob_id;
                        //proses query ambil data user
							Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
                                if(err){
                                    res.json(err);
                                }else{
                                    var job_config = data[0].Configs;                  
                                    //cek jumdata dulu									
									if(job_config.length > 0){
                                        for(var i = 0; i < job_config.length; i++){
                                            switch(job_config[i].config_key){
                                            case 'hostnameOozie':
                                                seedOozie.base.hostname = job_config[i].config_value;
                                                break;
                                            case 'portOozie':
                                                seedOozie.base.port = job_config[i].config_value;
                                                break;
                                            }
                                        }
                                        checkOozieJob(ooziejob_id, function(result3){
                                        	if (result3.err_code==0) {
                                        		console.log("MASUK . . .");
                                       			//method, endpoint, params, options, callback
	                                            var ApiOozie = new Apiclient(seedOozie);
												ApiOozie.get('get_oozie_auditlog', {"apikey": apikey, "ooziejob_id": ooziejob_id, "cluster_id": cluster_id}, {}, function (error, response, body) {													
													if(error){													
	                                                    res.json(error);
	                                                }else{
														if(body.length>0) {
															console.log("MASUK LAGI. . .");	
															res.set('Content-Type', 'text/plain');													
															res.send(body);												
														}else{
															res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
	                                              		}
													}
	                                            });
                                        	}else{
                                        		console.log("TIDAK MASUK . . . ");
                                        		res.json({"err_code":2,"err_msg":"Job Id is not found"});
                                        	}
                                        });
                                    }else{
                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                                    }                                    
                               	}
                            });
								       
		            }else{
		                result.err_code = 500;
		                res.json(result);
		            }
        		});
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //    
    // oozie status
    getOozieStatus: function OozieStatus(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
                getUserByApikey(apikey, function(result2){
                    if(result2.err_code == 0){
                    //ambil cluster_id
                        var cluster_id = result2.user_cluster_id;
                        var ooziejob_id = req.params.ooziejob_id;
                        //proses query ambil data user
							Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
                                if(err){
                                    res.json(err);
                                }else{
                                    var job_config = data[0].Configs;                  
                                    //cek jumdata dulu									
									if(job_config.length > 0){
                                        for(var i = 0; i < job_config.length; i++){
                                            switch(job_config[i].config_key){
                                            case 'hostnameOozie':
                                                seedOozie.base.hostname = job_config[i].config_value;
                                                break;
                                            case 'portOozie':
                                                seedOozie.base.port = job_config[i].config_value;
                                                break;
                                            }
                                        }
                                        checkOozieJob(ooziejob_id, function(result3){
                                        	if (result3.err_code==0) {
                                        		console.log("MASUK . . .");
                                       			//method, endpoint, params, options, callback
	                                            var ApiOozie = new Apiclient(seedOozie);
												ApiOozie.get('get_oozie_status', {"apikey": apikey, "ooziejob_id": ooziejob_id, "cluster_id": cluster_id}, {}, function (error, response, body) {													
													if(error){													
	                                                    res.json(error);
	                                                }else{
														if(body.length>0) {
															console.log("MASUK LAGI. . .");	
															var status = JSON.parse(body);
															res.json({"err_code": 0, "data": status});												
														}else{
															res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
	                                              		}
													}
	                                            });
                                        	}else{
                                        		console.log("TIDAK MASUK . . . ");
                                        		res.json({"err_code":2,"err_msg":"Job Id is not found"});
                                        	}
                                        });
                                    }else{
                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                                    }                                    
                               	}
                            });
								       
		            }else{
		                result.err_code = 500;
		                res.json(result);
		            }
        		});
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //
    // ADMIN UI
    // oozie configuration admin
    getOozieAdminConfiguration: function OozieAdminConfiguration(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
            	if(result.status == "root"){
	                getUserByApikey(apikey, function(result2){
	                    if(result2.err_code == 0){
	                    //ambil cluster_id
	                        var cluster_id = result2.user_cluster_id;
	                        var ooziejob_id = req.params.ooziejob_id;
	                        //proses query ambil data user
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs;                  
	                                    //cek jumdata dulu									
										if(job_config.length > 0){
	                                        for(var i = 0; i < job_config.length; i++){
	                                            switch(job_config[i].config_key){
	                                            case 'hostnameOozie':
	                                                seedOozie.base.hostname = job_config[i].config_value;
	                                                break;
	                                            case 'portOozie':
	                                                seedOozie.base.port = job_config[i].config_value;
	                                                break;
	                                            }
	                                        }
	                                        // checkOozieJob(ooziejob_id, function(result3){
	                                        	// if (result3.err_code==0) {
	                                        		console.log("MASUK . . .");
	                                       			//method, endpoint, params, options, callback
		                                            var ApiOozie = new Apiclient(seedOozie);
													ApiOozie.get('get_admin_configuration_oozie', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																console.log("MASUK LAGI. . .");	
																var status = JSON.parse(body);
																res.json({"err_code": 0, "data": status});												
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        	// }else{
	                                        	// 	console.log("TIDAK MASUK . . . ");
	                                        	// 	res.json({"err_code":2,"err_msg":"Job Id is not found"});
	                                        	// }
	                                        // });
	                                    }else{
	                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                    }                                    
	                               	}
	                            });
									       
			            }else{
			                result.err_code = 500;
			                res.json(result);
			            }
	        		});
        		}else{
						res.json({"err_code": 3, "err_msg": "Access denied"});
					}
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //
    // oozie status admin
    getOozieAdminStatus: function OozieAdminStatus(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
            	if(result.status == "root"){
	                getUserByApikey(apikey, function(result2){
	                    if(result2.err_code == 0){
	                    //ambil cluster_id
	                        var cluster_id = result2.user_cluster_id;
	                        var ooziejob_id = req.params.ooziejob_id;
	                        //proses query ambil data user
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs;                  
	                                    //cek jumdata dulu									
										if(job_config.length > 0){
	                                        for(var i = 0; i < job_config.length; i++){
	                                            switch(job_config[i].config_key){
	                                            case 'hostnameOozie':
	                                                seedOozie.base.hostname = job_config[i].config_value;
	                                                break;
	                                            case 'portOozie':
	                                                seedOozie.base.port = job_config[i].config_value;
	                                                break;
	                                            }
	                                        }
	                                        // checkOozieJob(ooziejob_id, function(result3){
	                                        	// if (result3.err_code==0) {
	                                        		console.log("MASUK . . .");
	                                       			//method, endpoint, params, options, callback
		                                            var ApiOozie = new Apiclient(seedOozie);
													ApiOozie.get('get_admin_status_oozie', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																console.log("MASUK LAGI. . .");	
																var status = JSON.parse(body);
																res.json({"err_code": 0, "data": status});												
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        	// }else{
	                                        	// 	console.log("TIDAK MASUK . . . ");
	                                        	// 	res.json({"err_code":2,"err_msg":"Job Id is not found"});
	                                        	// }
	                                        // });
	                                    }else{
	                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                    }                                    
	                               	}
	                            });
									       
			            }else{
			                result.err_code = 500;
			                res.json(result);
			            }
	        		});
        		}else{
						res.json({"err_code": 3, "err_msg": "Access denied"});
					}
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //
    // oozie OS Environment admin
    getOozieAdminOSenv: function OozieAdminOSenv(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
            	if(result.status == "root"){
	                getUserByApikey(apikey, function(result2){
	                    if(result2.err_code == 0){
	                    //ambil cluster_id
	                        var cluster_id = result2.user_cluster_id;
	                        var ooziejob_id = req.params.ooziejob_id;
	                        //proses query ambil data user
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs;                  
	                                    //cek jumdata dulu									
										if(job_config.length > 0){
	                                        for(var i = 0; i < job_config.length; i++){
	                                            switch(job_config[i].config_key){
	                                            case 'hostnameOozie':
	                                                seedOozie.base.hostname = job_config[i].config_value;
	                                                break;
	                                            case 'portOozie':
	                                                seedOozie.base.port = job_config[i].config_value;
	                                                break;
	                                            }
	                                        }
	                                        // checkOozieJob(ooziejob_id, function(result3){
	                                        	// if (result3.err_code==0) {
	                                        		console.log("MASUK . . .");
	                                       			//method, endpoint, params, options, callback
		                                            var ApiOozie = new Apiclient(seedOozie);
													ApiOozie.get('get_admin_osenv_oozie', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																console.log("MASUK LAGI. . .");	
																var status = JSON.parse(body);
																res.json({"err_code": 0, "data": status});												
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        	// }else{
	                                        	// 	console.log("TIDAK MASUK . . . ");
	                                        	// 	res.json({"err_code":2,"err_msg":"Job Id is not found"});
	                                        	// }
	                                        // });
	                                    }else{
	                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                    }                                    
	                               	}
	                            });
									       
			            }else{
			                result.err_code = 500;
			                res.json(result);
			            }
	        		});
        		}else{
						res.json({"err_code": 3, "err_msg": "Access denied"});
					}
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //
    // oozie Java System Properties admin
    getOozieAdminJavaSysPro: function OozieAdminJavaSysPro(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
            	if(result.status == "root"){
	                getUserByApikey(apikey, function(result2){
	                    if(result2.err_code == 0){
	                    //ambil cluster_id
	                        var cluster_id = result2.user_cluster_id;
	                        var ooziejob_id = req.params.ooziejob_id;
	                        //proses query ambil data user
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs;                  
	                                    //cek jumdata dulu									
										if(job_config.length > 0){
	                                        for(var i = 0; i < job_config.length; i++){
	                                            switch(job_config[i].config_key){
	                                            case 'hostnameOozie':
	                                                seedOozie.base.hostname = job_config[i].config_value;
	                                                break;
	                                            case 'portOozie':
	                                                seedOozie.base.port = job_config[i].config_value;
	                                                break;
	                                            }
	                                        }
	                                        // checkOozieJob(ooziejob_id, function(result3){
	                                        	// if (result3.err_code==0) {
	                                        		console.log("MASUK . . .");
	                                       			//method, endpoint, params, options, callback
		                                            var ApiOozie = new Apiclient(seedOozie);
													ApiOozie.get('get_admin_javasysproperties_oozie', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																console.log("MASUK LAGI. . .");	
																var status = JSON.parse(body);
																res.json({"err_code": 0, "data": status});												
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        	// }else{
	                                        	// 	console.log("TIDAK MASUK . . . ");
	                                        	// 	res.json({"err_code":2,"err_msg":"Job Id is not found"});
	                                        	// }
	                                        // });
	                                    }else{
	                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                    }                                    
	                               	}
	                            });
									       
			            }else{
			                result.err_code = 500;
			                res.json(result);
			            }
	        		});
        		}else{
						res.json({"err_code": 3, "err_msg": "Access denied"});
					}
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //
    // oozie Instrumentation admin
    getOozieAdminInstrumentation: function OozieAdminInstrumentation(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
            	if(result.status == "root"){
	                getUserByApikey(apikey, function(result2){
	                    if(result2.err_code == 0){
	                    //ambil cluster_id
	                        var cluster_id = result2.user_cluster_id;
	                        var ooziejob_id = req.params.ooziejob_id;
	                        //proses query ambil data user
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs;                  
	                                    //cek jumdata dulu									
										if(job_config.length > 0){
	                                        for(var i = 0; i < job_config.length; i++){
	                                            switch(job_config[i].config_key){
	                                            case 'hostnameOozie':
	                                                seedOozie.base.hostname = job_config[i].config_value;
	                                                break;
	                                            case 'portOozie':
	                                                seedOozie.base.port = job_config[i].config_value;
	                                                break;
	                                            }
	                                        }
	                                        // checkOozieJob(ooziejob_id, function(result3){
	                                        	// if (result3.err_code==0) {
	                                        		console.log("MASUK . . .");
	                                       			//method, endpoint, params, options, callback
		                                            var ApiOozie = new Apiclient(seedOozie);
													ApiOozie.get('get_admin_instrumentation_oozie', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																console.log("MASUK LAGI. . .");	
																var status = JSON.parse(body);
																res.json({"err_code": 0, "data": status});												
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        	// }else{
	                                        	// 	console.log("TIDAK MASUK . . . ");
	                                        	// 	res.json({"err_code":2,"err_msg":"Job Id is not found"});
	                                        	// }
	                                        // });
	                                    }else{
	                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                    }                                    
	                               	}
	                            });
									       
			            }else{
			                result.err_code = 500;
			                res.json(result);
			            }
	        		});
        		}else{
						res.json({"err_code": 3, "err_msg": "Access denied"});
					}
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //
    // oozie Build Version admin or user
    getOozieAdminBuildVersion: function OozieAdminBuildVersion(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
	                getUserByApikey(apikey, function(result2){
	                    if(result2.err_code == 0){
	                    //ambil cluster_id
	                        var cluster_id = result2.user_cluster_id;
	                        var ooziejob_id = req.params.ooziejob_id;
	                        //proses query ambil data user
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs;                  
	                                    //cek jumdata dulu									
										if(job_config.length > 0){
	                                        for(var i = 0; i < job_config.length; i++){
	                                            switch(job_config[i].config_key){
	                                            case 'hostnameOozie':
	                                                seedOozie.base.hostname = job_config[i].config_value;
	                                                break;
	                                            case 'portOozie':
	                                                seedOozie.base.port = job_config[i].config_value;
	                                                break;
	                                            }
	                                        }
	                                        // checkOozieJob(ooziejob_id, function(result3){
	                                        	// if (result3.err_code==0) {
	                                        		console.log("MASUK . . .");
	                                       			//method, endpoint, params, options, callback
		                                            var ApiOozie = new Apiclient(seedOozie);
													ApiOozie.get('get_admin_buildVersion_oozie', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																console.log("MASUK LAGI. . .");	
																var status = JSON.parse(body);
																res.json({"err_code": 0, "data": status});												
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        	// }else{
	                                        	// 	console.log("TIDAK MASUK . . . ");
	                                        	// 	res.json({"err_code":2,"err_msg":"Job Id is not found"});
	                                        	// }
	                                        // });
	                                    }else{
	                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                    }                                    
	                               	}
	                            });
									       
			            }else{
			                result.err_code = 500;
			                res.json(result);
			            }
	        		});        		
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //
    // oozie Available Time Zones admin or user
    getOozieAdminTimezones: function OozieAdminTimezones(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
	                getUserByApikey(apikey, function(result2){
	                    if(result2.err_code == 0){
	                    //ambil cluster_id
	                        var cluster_id = result2.user_cluster_id;
	                        var ooziejob_id = req.params.ooziejob_id;
	                        //proses query ambil data user
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs;                  
	                                    //cek jumdata dulu									
										if(job_config.length > 0){
	                                        for(var i = 0; i < job_config.length; i++){
	                                            switch(job_config[i].config_key){
	                                            case 'hostnameOozie':
	                                                seedOozie.base.hostname = job_config[i].config_value;
	                                                break;
	                                            case 'portOozie':
	                                                seedOozie.base.port = job_config[i].config_value;
	                                                break;
	                                            }
	                                        }
	                                        // checkOozieJob(ooziejob_id, function(result3){
	                                        	// if (result3.err_code==0) {
	                                        		console.log("MASUK . . .");
	                                       			//method, endpoint, params, options, callback
		                                            var ApiOozie = new Apiclient(seedOozie);
													ApiOozie.get('get_admin_availabletimezones_oozie', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																console.log("MASUK LAGI. . .");	
																var status = JSON.parse(body);
																res.json({"err_code": 0, "data": status});												
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        	// }else{
	                                        	// 	console.log("TIDAK MASUK . . . ");
	                                        	// 	res.json({"err_code":2,"err_msg":"Job Id is not found"});
	                                        	// }
	                                        // });
	                                    }else{
	                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                    }                                    
	                               	}
	                            });
									       
			            }else{
			                result.err_code = 500;
			                res.json(result);
			            }
	        		});        		
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    //
    // oozie Available Oozie Servers admin
    getOozieAdminServers: function OozieAdminServers(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
            	if(result.status == "root"){
	                getUserByApikey(apikey, function(result2){
	                    if(result2.err_code == 0){
	                    //ambil cluster_id
	                        var cluster_id = result2.user_cluster_id;
	                        var ooziejob_id = req.params.ooziejob_id;
	                        //proses query ambil data user
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs;                  
	                                    //cek jumdata dulu									
										if(job_config.length > 0){
	                                        for(var i = 0; i < job_config.length; i++){
	                                            switch(job_config[i].config_key){
	                                            case 'hostnameOozie':
	                                                seedOozie.base.hostname = job_config[i].config_value;
	                                                break;
	                                            case 'portOozie':
	                                                seedOozie.base.port = job_config[i].config_value;
	                                                break;
	                                            }
	                                        }
	                                        // checkOozieJob(ooziejob_id, function(result3){
	                                        	// if (result3.err_code==0) {
	                                        		console.log("MASUK . . .");
	                                       			//method, endpoint, params, options, callback
		                                            var ApiOozie = new Apiclient(seedOozie);
													ApiOozie.get('get_admin_servers_oozie', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																console.log("MASUK LAGI. . .");	
																var status = JSON.parse(body);
																res.json({"err_code": 0, "data": status});												
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        	// }else{
	                                        	// 	console.log("TIDAK MASUK . . . ");
	                                        	// 	res.json({"err_code":2,"err_msg":"Job Id is not found"});
	                                        	// }
	                                        // });
	                                    }else{
	                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                    }                                    
	                               	}
	                            });
									       
			            }else{
			                result.err_code = 500;
			                res.json(result);
			            }
	        		});
        		}else{
						res.json({"err_code": 3, "err_msg": "Access denied"});
					}
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },
    // oozie List Sharelib admin
    getOozieAdminSharelib: function OozieAdminSharelib(req, res){
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;
        
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}

        checkApikey(apikey, ipAddres, function(result){
            if(result.err_code == 0){
            	if(result.status == "root"){
	                getUserByApikey(apikey, function(result2){
	                    if(result2.err_code == 0){
	                    //ambil cluster_id
	                        var cluster_id = result2.user_cluster_id;
	                        var ooziejob_id = req.params.ooziejob_id;
	                        //proses query ambil data user
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){								
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs;                  
	                                    //cek jumdata dulu									
										if(job_config.length > 0){
	                                        for(var i = 0; i < job_config.length; i++){
	                                            switch(job_config[i].config_key){
	                                            case 'hostnameOozie':
	                                                seedOozie.base.hostname = job_config[i].config_value;
	                                                break;
	                                            case 'portOozie':
	                                                seedOozie.base.port = job_config[i].config_value;
	                                                break;
	                                            }
	                                        }
	                                        // checkOozieJob(ooziejob_id, function(result3){
	                                        	// if (result3.err_code==0) {
	                                        		console.log("MASUK . . .");
	                                       			//method, endpoint, params, options, callback
		                                            var ApiOozie = new Apiclient(seedOozie);
													ApiOozie.get('get_admin_sharelib_oozie', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																console.log("MASUK LAGI. . .");	
																var status = JSON.parse(body);
																res.json({"err_code": 0, "data": status});												
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        	// }else{
	                                        	// 	console.log("TIDAK MASUK . . . ");
	                                        	// 	res.json({"err_code":2,"err_msg":"Job Id is not found"});
	                                        	// }
	                                        // });
	                                    }else{
	                                        res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                    }                                    
	                               	}
	                            });
									       
			            }else{
			                result.err_code = 500;
			                res.json(result);
			            }
	        		});
        		}else{
						res.json({"err_code": 3, "err_msg": "Access denied"});
					}
			}else{
	            result.err_code = 500;
	            res.json(result);
		     }
		});
    },

}

//YARN
var Yarn = {
	getYarnJob: function YarnJob(req, res){
		var ipAddres = req.connection.remoteAddress;
	    var apikey = req.params.apikey;
	    var ipAddresHeader = req.headers.api;
	    
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}
		checkApikey(apikey, ipAddres, function(result){
			if (result.err_code == 0) {
				getUserByApikey(apikey, function(result2){
					if(result2.err_code == 0){
						var cluster_id = result2.user_cluster_id;
						var yarn_job_id = req.params.yarn_job_id;
						if (typeof yarn_job_id !== 'undefined') {
							Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){		
							// res.json(data);
                                if(err){
                                    res.json(err);
                                }else{
                                    var job_config = data[0].Configs; //object                   
                                        //cek jumdata dulu
										console.log(job_config);
										if(job_config.length > 0){
                                            for(var i = 0; i < job_config.length; i++){
                                                switch(job_config[i].config_key){
                                                case 'hostnameYarn':
                                                    seedYarn.base.hostname = job_config[i].config_value;
                                                    break;
                                                case 'portYarn':
                                                    seedYarn.base.port = job_config[i].config_value;
                                                    break;
                                                }
                                            }
                                            checkYarnJob(yarn_job_id, function(result3){
                                            	if (result3.err_code == 0) {   
                                            		console.log("SINI . . . ");
		                                            var ApiYarn = new Apiclient(seedYarn);
													ApiYarn.get('get_yarn_info', {"apikey": apikey, "yarn_job_id": yarn_job_id, "cluster_id": cluster_id}, {}, function (error, response, body) {							
														// console.log(job);
														console.log("SINI LAGI  . . .");													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																var job = JSON.parse(body);	
																var job1 = JSON.parse(body);
																if(job = job.app){
																	console.log("SUCCESS . . . ");
																	res.json({"err_code": 0, "data": job});
																}else{
																	console.log("ERROR . . . ");
																	res.json({"err_code": 2, "data": job1.RemoteException});	

																}										
																// console.log(job);
																							
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
                                            	}else{
                                        		res.json({"err_code":2,"err_msg":"Job Id is not found"});
                                        	}

												});
                                        }else{
                                            res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                                        }                                    
                                }
                            });

						}else{
							Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){		
							// res.json(data);
                                if(err){
                                    res.json(err);
                                }else{
                                    var job_config = data[0].Configs; //object                   
                                        //cek jumdata dulu
										console.log(job_config);
										if(job_config.length > 0){
                                            for(var i = 0; i < job_config.length; i++){
                                                switch(job_config[i].config_key){
                                                case 'hostnameYarn':
                                                    seedYarn.base.hostname = job_config[i].config_value;
                                                    break;
                                                case 'portYarn':
                                                    seedYarn.base.port = job_config[i].config_value;
                                                    break;
                                                }
                                            }
	                                            var ApiYarn = new Apiclient(seedYarn);
												ApiYarn.get('get_all_yarn', {"apikey": apikey}, {}, function (error, response, body) {							
													if(error){													
	                                                    res.json(error);
	                                                }else{
														if(body.length>0) {
															var job_all = JSON.parse(body);												
															res.json({"err_code": 0, "data": job_all.apps.app});								

														}else{
															res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
	                                              		}
													}
	                                            });
                                        }else{
                                            res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                                        }                                    
                                }
                            });
						}
					}else{
						result2.err_code = 500;
				                res.json(result2);

					}
				});			
			}else{
				result.err_code = 500;
				res.json(result);
			}
		});
	},
	//
	// Cluster info
	getClusterInfo: function ClusterInfo(req, res){
		var ipAddres = req.connection.remoteAddress;
	    var apikey = req.params.apikey;
	    var ipAddresHeader = req.headers.api;
	    
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}
		checkApikey(apikey, ipAddres, function(result){
			if (result.err_code == 0) {
					getUserByApikey(apikey, function(result2){
						if(result2.err_code == 0){
							var cluster_id = result2.user_cluster_id;
							var yarn_job_id = req.params.yarn_job_id;
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){		
								// res.json(data);
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs; //object                   
	                                        //cek jumdata dulu
											console.log(job_config);
											if(job_config.length > 0){
	                                            for(var i = 0; i < job_config.length; i++){
	                                                switch(job_config[i].config_key){
	                                                case 'hostnameYarn':
	                                                    seedYarn.base.hostname = job_config[i].config_value;
	                                                    break;
	                                                case 'portYarn':
	                                                    seedYarn.base.port = job_config[i].config_value;
	                                                    break;
	                                                }
	                                            }                                              
	                                        		console.log("SINI . . . ");
		                                            var ApiYarn = new Apiclient(seedYarn);
													ApiYarn.get('cluster_info', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {							
														// console.log(job);
														console.log("SINI LAGI  . . .");													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																var info = JSON.parse(body);									
																var conv = {
                                                                                "id":info.clusterInfo.id,
                                                                                "startedOn":info.clusterInfo.startedOn,
                                                                                "state":info.clusterInfo.state,
                                                                                "haState":info.clusterInfo.haState,
                                                                                "rmStateStoreName":info.clusterInfo.rmStateStoreName,
                                                                                "resourceManagerVersion": info.clusterInfo.resourceManagerVersion,
                                                                                "resourceManagerBuildVersion": info.clusterInfo.resourceManagerBuildVersion,
                                                                                "resourceManagerVersionBuiltOn":getFormattedDate(),
                                                                                "hadoopVersion": info.clusterInfo.hadoopVersion,
                                                                                "hadoopBuildVersion": info.clusterInfo.hadoopBuildVersion,
                                                                                "hadoopVersionBuiltOn" : getFormattedDate()

                                                                            };

																
															
																
																res.json({"err_code": 0, "data": conv});																																														
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        
	                                        }else{
	                                            res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                        }                                    
	                                }
	                            });
						}else{
							result2.err_code = 500;
					                res.json(result2);
						}
					});			
			}else{
				result.err_code = 500;
				res.json(result);
			}
		});
	},
	//
		// Cluster info
	getClusterNodes: function ClusterNodes(req, res){
		var ipAddres = req.connection.remoteAddress;
	    var apikey = req.params.apikey;
	    var ipAddresHeader = req.headers.api;
	    
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}
		checkApikey(apikey, ipAddres, function(result){
			if (result.err_code == 0) {
					getUserByApikey(apikey, function(result2){
						if(result2.err_code == 0){
							var cluster_id = result2.user_cluster_id;
							var yarn_job_id = req.params.yarn_job_id;
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){		
								// res.json(data);
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs; //object                   
	                                        //cek jumdata dulu
											console.log(job_config);
											if(job_config.length > 0){
	                                            for(var i = 0; i < job_config.length; i++){
	                                                switch(job_config[i].config_key){
	                                                case 'hostnameYarn':
	                                                    seedYarn.base.hostname = job_config[i].config_value;
	                                                    break;
	                                                case 'portYarn':
	                                                    seedYarn.base.port = job_config[i].config_value;
	                                                    break;
	                                                }
	                                            }                                              
	                                        		console.log("SINI . . . ");
		                                            var ApiYarn = new Apiclient(seedYarn);
													ApiYarn.get('cluster_nodes', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {							
														// console.log(job);
														console.log("SINI LAGI  . . .");													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																var info = JSON.parse(body);
																res.json({"err_code": 0, "data": info});																																														
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        
	                                        }else{
	                                            res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                        }                                    
	                                }
	                            });
						}else{
							result2.err_code = 500;
					                res.json(result2);
						}
					});			
			}else{
				result.err_code = 500;
				res.json(result);
			}
		});
	},
	//
	// Cluster Metrics 
	getClusterMetrics: function ClusterMetrics(req, res){
		var ipAddres = req.connection.remoteAddress;
	    var apikey = req.params.apikey;
	    var ipAddresHeader = req.headers.api;
	    
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}
		checkApikey(apikey, ipAddres, function(result){
			if (result.err_code == 0) {
					getUserByApikey(apikey, function(result2){
						if(result2.err_code == 0){
							var cluster_id = result2.user_cluster_id;
							var yarn_job_id = req.params.yarn_job_id;
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){		
								// res.json(data);
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs; //object                   
	                                        //cek jumdata dulu
											console.log(job_config);
											if(job_config.length > 0){
	                                            for(var i = 0; i < job_config.length; i++){
	                                                switch(job_config[i].config_key){
	                                                case 'hostnameYarn':
	                                                    seedYarn.base.hostname = job_config[i].config_value;
	                                                    break;
	                                                case 'portYarn':
	                                                    seedYarn.base.port = job_config[i].config_value;
	                                                    break;
	                                                }
	                                            }                                              
	                                        		console.log("SINI . . . ");
		                                            var ApiYarn = new Apiclient(seedYarn);
													ApiYarn.get('cluster_metrics', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {							
														// console.log(job);
														console.log("SINI LAGI  . . .");													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																var info = JSON.parse(body);
																res.json({"err_code": 0, "data": info});																																														
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        
	                                        }else{
	                                            res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                        }                                    
	                                }
	                            });
						}else{
							result2.err_code = 500;
					                res.json(result2);

						}
					});				
			}else{
				result.err_code = 500;
				res.json(result);
			}
		});
	},
	//
	// Cluster Scheduler
	getClusterScheduler: function ClusterScheduler(req, res){
		var ipAddres = req.connection.remoteAddress;
	    var apikey = req.params.apikey;
	    var ipAddresHeader = req.headers.api;
	    
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}
		checkApikey(apikey, ipAddres, function(result){
			if (result.err_code == 0) {				
					getUserByApikey(apikey, function(result2){
						if(result2.err_code == 0){
							var cluster_id = result2.user_cluster_id;
							var yarn_job_id = req.params.yarn_job_id;
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){		
								// res.json(data);
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs; //object                   
	                                        //cek jumdata dulu
											console.log(job_config);
											if(job_config.length > 0){
	                                            for(var i = 0; i < job_config.length; i++){
	                                                switch(job_config[i].config_key){
	                                                case 'hostnameYarn':
	                                                    seedYarn.base.hostname = job_config[i].config_value;
	                                                    break;
	                                                case 'portYarn':
	                                                    seedYarn.base.port = job_config[i].config_value;
	                                                    break;
	                                                }
	                                            }                                              
	                                        		console.log("SINI . . . ");
		                                            var ApiYarn = new Apiclient(seedYarn);
													ApiYarn.get('cluster_scheduler', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {							
														// console.log(job);
														console.log("SINI LAGI  . . .");													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																var info = JSON.parse(body);
																res.json({"err_code": 0, "data": info.scheduler});																																														
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        
	                                        }else{
	                                            res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                        }                                    
	                                }
	                            });
						}else{
							result2.err_code = 500;
					                res.json(result2);

						}
					});					
			}else{
				result.err_code = 500;
				res.json(result);
			}
		});
	},
	//
	// Cluster Application Statistics
	getClusterAppstatistics: function ClusterAppstatistics(req, res){
		var ipAddres = req.connection.remoteAddress;
	    var apikey = req.params.apikey;
	    var ipAddresHeader = req.headers.api;
	    
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}
		checkApikey(apikey, ipAddres, function(result){
			if (result.err_code == 0) {				
					getUserByApikey(apikey, function(result2){
						if(result2.err_code == 0){
							var cluster_id = result2.user_cluster_id;
							var yarn_job_id = req.params.yarn_job_id;
								Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){		
								// res.json(data);
	                                if(err){
	                                    res.json(err);
	                                }else{
	                                    var job_config = data[0].Configs; //object                   
	                                        //cek jumdata dulu
											console.log(job_config);
											if(job_config.length > 0){
	                                            for(var i = 0; i < job_config.length; i++){
	                                                switch(job_config[i].config_key){
	                                                case 'hostnameYarn':
	                                                    seedYarn.base.hostname = job_config[i].config_value;
	                                                    break;
	                                                case 'portYarn':
	                                                    seedYarn.base.port = job_config[i].config_value;
	                                                    break;
	                                                }
	                                            }                                              
	                                        		console.log("SINI . . . ");
		                                            var ApiYarn = new Apiclient(seedYarn);
													ApiYarn.get('cluster_appstatistics', {"apikey": apikey, "cluster_id": cluster_id}, {}, function (error, response, body) {							
														// console.log(job);
														console.log("SINI LAGI  . . .");													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																var info = JSON.parse(body);
																res.json({"err_code": 0, "data": info.appStatInfo});																																														
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
	                                        
	                                        }else{
	                                            res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
	                                        }                                    
	                                }
	                            });
						}else{
							result2.err_code = 500;
					                res.json(result2);

						}
					});					
			}else{
				result.err_code = 500;
				res.json(result);
			}
		});
	},
	//
	// Cluster Application Attempts
	getClusterAttempts: function ClusterAttempts(req, res){
		var ipAddres = req.connection.remoteAddress;
	    var apikey = req.params.apikey;
	    var ipAddresHeader = req.headers.api;
	    
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}
		checkApikey(apikey, ipAddres, function(result){
			if (result.err_code == 0) {
				getUserByApikey(apikey, function(result2){
					if(result2.err_code == 0){
						var cluster_id = result2.user_cluster_id;
						var yarn_job_id = req.params.yarn_job_id;
						if (typeof yarn_job_id !== 'undefined') {
							Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){		
							// res.json(data);
                                if(err){
                                    res.json(err);
                                }else{
                                    var job_config = data[0].Configs; //object                   
                                        //cek jumdata dulu
										console.log(job_config);
										if(job_config.length > 0){
                                            for(var i = 0; i < job_config.length; i++){
                                                switch(job_config[i].config_key){
                                                case 'hostnameYarn':
                                                    seedYarn.base.hostname = job_config[i].config_value;
                                                    break;
                                                case 'portYarn':
                                                    seedYarn.base.port = job_config[i].config_value;
                                                    break;
                                                }
                                            }
                                            checkYarnJob(yarn_job_id, function(result3){
                                            	if (result3.err_code == 0) {   
                                            		console.log("SINI . . . ");
		                                            var ApiYarn = new Apiclient(seedYarn);
													ApiYarn.get('cluster_appattempts', {"apikey": apikey, "yarn_job_id": yarn_job_id, "cluster_id": cluster_id}, {}, function (error, response, body) {																																			
														console.log("SINI LAGI  . . .");													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {														
																var job = JSON.parse(body);	
																var job1 = JSON.parse(body);
																var appt = job.appAttempts;
																if(job = appt){	
																	for(key in appt.appAttempt){
																		// appt.appAttempt[key].startTime = getFormattedDate();
																		console.log(appt.appAttempt[key].startTime);																																	
																	}				
																	// dataJob[key].job_name = data[0].Jobs[key].job_name;																											
																	console.log("SUCCESS . . . ");
																	
																	res.json({"err_code": 0, "data": appt.appAttempt});
																}else{
																	console.log("ERROR . . . ");
																	res.json({"err_code": 2, "data": job1.RemoteException});	

																}	
																	

																// }else{
																// 	console.log("ERROR . . . ");
																// 	res.json({"err_code": 2, "data": job1.RemoteException});

																// }
																														
															}else{
																console.log("ERROR . . . ");
																res.json({"err_code": 2, "data": job1.RemoteException});
		                                              		}
														}
		                                            });
                                            	}else{
                                        		res.json({"err_code":2,"err_msg":"Job Id is not found"});
                                        	}

												});
                                        }else{
                                            res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                                        }                                    
                                }
                            });

						}else{
							res.json({"err_code":2,"err_msg":"Job Id is not found"}); 

						}
					}else{
						result2.err_code = 500;
				                res.json(result2);

					}
				});			
			}else{
				result.err_code = 500;
				res.json(result);
			}
		});
	},
	//
	// Cluster Application Attempts
	getClusterState: function ClusterState(req, res){
		var ipAddres = req.connection.remoteAddress;
	    var apikey = req.params.apikey;
	    var ipAddresHeader = req.headers.api;
	    
		//check ip dengan header
		if (typeof ipAddresHeader !== 'undefined') {
		    ipAddres = ipAddresHeader;          
		}
		checkApikey(apikey, ipAddres, function(result){
			if (result.err_code == 0) {
				getUserByApikey(apikey, function(result2){
					if(result2.err_code == 0){
						var cluster_id = result2.user_cluster_id;
						var yarn_job_id = req.params.yarn_job_id;
						if (typeof yarn_job_id !== 'undefined') {
							Api_cluster.findJoin({"cluster_id": cluster_id},{Config : "config_cluster_id"},function(err,data){		
							// res.json(data);
                                if(err){
                                    res.json(err);
                                }else{
                                    var job_config = data[0].Configs; //object                   
                                        //cek jumdata dulu
										console.log(job_config);
										if(job_config.length > 0){
                                            for(var i = 0; i < job_config.length; i++){
                                                switch(job_config[i].config_key){
                                                case 'hostnameYarn':
                                                    seedYarn.base.hostname = job_config[i].config_value;
                                                    break;
                                                case 'portYarn':
                                                    seedYarn.base.port = job_config[i].config_value;
                                                    break;
                                                }
                                            }
                                            checkYarnJob(yarn_job_id, function(result3){
                                            	if (result3.err_code == 0) {   
                                            		console.log("SINI . . . ");
		                                            var ApiYarn = new Apiclient(seedYarn);
													ApiYarn.get('cluster_state', {"apikey": apikey, "yarn_job_id": yarn_job_id, "cluster_id": cluster_id}, {}, function (error, response, body) {																					
														console.log("SINI LAGI  . . .");													
														if(error){													
		                                                    res.json(error);
		                                                }else{
															if(body.length>0) {
																var job = JSON.parse(body);																											
																	res.json({"err_code": 0, "data": job});																																
															}else{
																res.json({"err_code":2,"err_msg":"Job Id is not found"});                                               		
		                                              		}
														}
		                                            });
                                            	}else{
                                        		res.json({"err_code":2,"err_msg":"Job Id is not found"});
                                        	}

												});
                                        }else{
                                            res.json({"err_code": 2, "err_msg": "Job Configuration is not found"});
                                        }                                    
                                }
                            });

						}else{

						}
					}else{
						result2.err_code = 500;
				                res.json(result2);

					}
				});			
			}else{
				result.err_code = 500;
				res.json(result);
			}
		});
	},
	//

}

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
                      x({"err_code": 5, "err_msg": "User is not active"});
                  }
              }else{
                x({"err_code": 4, "err_msg": "IP Address is not registered"});
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
	function x(result){
		callback(result)
	}
}

function getUserByApikey(apikey, callback){
	//method, endpoint, params, options, callback
	Api_user.findWhere({"user_apikey": apikey},function(err,data){
		if(err){
			x(err);
		}else{
			if(data.length>0){
				var user_cluster_id = data[0].user_cluster_id;
				var user_id = data[0].user_id;
				if(user_cluster_id==null){
					Api_cluster.findWhere({"cluster_status" : "default"},function(err,data){
            if(err){
              x({"err_code" : 500, "err_msg" : err});
            }else{
              if(data.length>0){
                x({"err_code": 0, "user_cluster_id":data[0].cluster_id, "user_id":user_id});
              }else{
                x({"err_code" : 3, "err_msg" : "default_config is not found"});
              }
            }
          });
        }else{
					x({"err_code": 0, "user_cluster_id":user_cluster_id, "user_id":user_id});
				}
			}else{
				x({"err_code": 2, "err_msg": "Apikey failed", "application": "Api Baciro Oozie", "function": "getUserByApikey"});
			}
		}
	});
	function x(result){
		callback(result)
	}
}

function generateWorkflow(jarName, jobName, className, argumenInput,argumenOutput,argumenOthers, queueName) {
  xw = new XMLWriter(true);

	//var jarName, jobName, className, argumenInputOutput ;

    var countInput = (argumenInput.match(/,/g) || []).length;
    var countOutput = (argumenOutput.match(/,/g) || []).length;
    if(argumenOthers !== undefined) {
      var countOthers = (argumenOthers.match(/,/g) || []).length;
    }
    var newArg = '';

      xw.startElement('workflow-app').writeAttribute('xmlns', 'uri:oozie:workflow:0.5').writeAttribute('name', jobName);
        xw.startElement('start').writeAttribute('to', 'hgrid');
        xw.endElement();
        xw.startElement('action').writeAttribute('name', 'hgrid');
          xw.startElement('java');
            xw.writeElement('job-tracker', '${jobTracker}');
            xw.writeElement('name-node', '${nameNode}');
            //xw.startElement('prepare');
              //xw.startElement('delete').writeAttribute('path', "${nameNode}"+argumenOutput);
              //xw.endElement();
            //xw.endElement();
            xw.startElement('configuration');
              xw.startElement('property');
                xw.writeElement('name', 'mapred.job.queue.name');
                xw.writeElement('value', queueName);
              xw.endElement();
            xw.endElement();
            xw.writeElement('main-class', className);
						//checking argument input
            if(argumenInput != ""){
              for(var i=0;i<=countInput;i++){
                  if(argumenInput.search(',') != -1){
                      newArg = argumenInput.substring(0, argumenInput.search(','));
                  }
                  else{
                      newArg = argumenInput;
                  }
                  argumenInput = argumenInput.substring(argumenInput.search(',')+1, argumenInput.length);
                  xw.writeElement('arg', "${nameNode}"+newArg);
              }
            }

						//checking argument output
            if(argumenOutput != ""){
              for(var i=0;i<=countOutput;i++){
                  if(argumenOutput.search(',') != -1){
                      newArg = argumenOutput.substring(0, argumenOutput.search(','));
                  }
                  else{
                      newArg = argumenOutput;
                  }
                  argumenOutput = argumenOutput.substring(argumenOutput.search(',')+1, argumenOutput.length);
                  xw.writeElement('arg', "${nameNode}"+newArg);
              }
						  // xw.writeElement('arg', "${nameNode}"+argumenOutput);
            }

						if(argumenOthers != "") {
              for(var i=0;i<=countOthers;i++){
                  if(argumenOthers.search(',') != -1){
                      newArg = argumenOthers.substring(0, argumenOthers.search(','));
                  }
                  else{
                      newArg = argumenOthers;
                  }
                  argumenOthers = argumenOthers.substring(argumenOthers.search(',')+1, argumenOthers.length);
                  xw.writeElement('arg', "${nameNode}"+newArg);
              }
            }
            xw.writeElement('file', "${nameNode}"+jarName);
            xw.startElement('capture-output');
            xw.endElement();
          xw.endElement();
          xw.startElement('ok').writeAttribute('to', 'end');
          xw.endElement();
          xw.startElement('error').writeAttribute('to', 'fail');
          xw.endElement();
        xw.endElement();
        xw.startElement('kill').writeAttribute('name', 'fail');
          xw.writeElement('message', 'Workflow failed, error message[${wf:errorMessage(wf:lastErrorNode())}]');
        xw.endElement();
        xw.startElement('end').writeAttribute('name', 'end');
        xw.endElement();
      xw.endElement();
      return xw;
}

function generateXml(usernameOozie, nameNode, /*examplesRoot,*/ jobTracker, queueName, useSystemLibpath, oozieLibpath, wfPath) {
  xw = new XMLWriter(true);

  xw.startDocument();
     xw.startElement('configuration');
       xw.startElement('property');
         xw.writeElement('name','user.name');
         xw.writeElement('value', usernameOozie);
       xw.endElement();
       xw.startElement('property');
         xw.writeElement('name','nameNode');
         xw.writeElement('value', nameNode);
       xw.endElement();
       xw.startElement('property');
         xw.writeElement('name','jobTracker');
         xw.writeElement('value',jobTracker);
       xw.endElement();
       xw.startElement('property');
         xw.writeElement('name','queueName');
         xw.writeElement('value', queueName);
       xw.endElement();
      //  xw.startElement('property');
      //    xw.writeElement('name','examplesRoot');
      //    xw.writeElement('value', examplesRoot);
      //  xw.endElement();
       xw.startElement('property');
         xw.writeElement('name','oozie.use.system.libpath');
         xw.writeElement('value', useSystemLibpath); //boolean
       xw.endElement();
       xw.startElement('property');
         xw.writeElement('name','oozie.libpath');
         xw.writeElement('value', oozieLibpath); //dibuat client input
       xw.endElement();
       xw.startElement('property');
         xw.writeElement('name','oozie.wf.application.path');
         xw.writeElement('value', wfPath);
       xw.endElement();

    xw.toString();
    return xw;
  }

function getFormattedDate() {
    var date = new Date();
    var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    return str;
}

function checkOozieJob(oozie_job_id,callback){
    Api_job.findById({"oozie_job_id" : oozie_job_id},function(err,data){
        if(err){
          x(err);
        }else{
          if(data.length>0){
            x({"err_code": 0, "status": "Job ID is Exist", "data" : data});
          }else{
            x({"err_code": 1, "status": "Job ID id is not found"});
          }
        }
    });

    function x(result){
		  callback(result)
	  }
}

//check Yarn Job
function checkYarnJob(yarn_job_id,callback){
    Api_job.findById({"yarn_job_id" : yarn_job_id},function(err,data){
        if(err){
          x(err);
        }else{
          if(data.length>0){
            x({"err_code": 0, "status": "Yarn Job ID is Exist", "data" : data});
          }else{
            x({"err_code": 1, "status": "Yarn Job ID id is not found"});
          }
        }
    });

    function x(result){
		  callback(result)
	  }
}


//get method oozie
app.get('/:apikey/get_job_id', Oozie.getjobid);
app.get('/:apikey/job_info_oozie/:ooziejob_id?', Oozie.getOozieJob); //bisa IUI admin or user
app.get('/:apikey/job_success_oozie', Oozie.SuccessAllOozie); //bisa UI admin or user
app.get('/:apikey/job_graph_oozie/:ooziejob_id', Oozie.getOozieGraph);
app.get('/:apikey/job_definition_oozie/:ooziejob_id', Oozie.getOozieDefinition);
app.get('/:apikey/job_log_oozie/:ooziejob_id', Oozie.getOozieLog);
app.get('/:apikey/job_auditlog_oozie/:ooziejob_id', Oozie.getOozieAuditLog);
app.get('/:apikey/job_status_oozie/:ooziejob_id', Oozie.getOozieStatus);
app.get('/:apikey/get_history_oozie/project/:project_id', Oozie.getHistoryOozie);

//admin
app.get('/:apikey/admin_config_oozie', Oozie.getOozieAdminConfiguration);
app.get('/:apikey/admin_status_oozie', Oozie.getOozieAdminStatus);
app.get('/:apikey/admin_osenv_oozie', Oozie.getOozieAdminOSenv);
app.get('/:apikey/admin_javasyspro_oozie', Oozie.getOozieAdminJavaSysPro);
app.get('/:apikey/admin_instrumen_oozie', Oozie.getOozieAdminInstrumentation);
app.get('/:apikey/admin_version_oozie', Oozie.getOozieAdminBuildVersion);
app.get('/:apikey/admin_timezones_oozie', Oozie.getOozieAdminTimezones);
app.get('/:apikey/admin_servers_oozie', Oozie.getOozieAdminServers);
app.get('/:apikey/admin_sharelib_oozie', Oozie.getOozieAdminSharelib);

//get method yarn
app.get('/:apikey/job_info_yarn/:yarn_job_id?', Yarn.getYarnJob); //bisa di UI admin or user
app.get('/:apikey/job_info_cluster', Yarn.getClusterInfo); //bisa di UI admin or user
app.get('/:apikey/job_nodes_cluster', Yarn.getClusterNodes); //bisa di UI admin or user
app.get('/:apikey/job_metrics_cluster', Yarn.getClusterMetrics); //bisa di UI admin or user
app.get('/:apikey/job_scheduler_cluster', Yarn.getClusterScheduler); //bisa di UI admin or user
app.get('/:apikey/job_appstatistics_cluster', Yarn.getClusterAppstatistics); //bisa di UI admin or user
app.get('/:apikey/job_appattempts_yarn/:yarn_job_id', Yarn.getClusterAttempts); //bisa di UI admin or user
app.get('/:apikey/job_state_yarn/:yarn_job_id', Yarn.getClusterState); //bisa di UI admin or user


//post method
app.post('/:apikey/submit_job', Oozie.post);
app.post('/:apikey/generate_xml', Oozie.getxml);//tapi methodnya post soalnya perlu input user

var server = app.listen(port, host, function () {
  console.log("Server running at http://%s:%s", host, port);
});

/*var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)

})*/
