var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var yamlconfig = require('yaml-config');
var configYaml = yamlconfig.readConfig('../config/config.yml');
var Apiclient = require('apiclient');
var md5 = require('md5');
var path = require("path");

var host = configYaml.cluster.host;
var port = configYaml.cluster.port;
//phoenix
//query data melalui rest phoenix
// var seedPhoenix = require("../config/seed_phoenix.json");
// 	seedPhoenix.base.hostname = configYaml.phoenix.host;
// 	seedPhoenix.base.port 		= configYaml.phoenix.port;
// var Api = new Apiclient(seedPhoenix);

//ORM(DEPLOYEMENT)
var Database = require("../mysql/Mysql.js");
var Api_user = Database('User');
var Api_config = Database('Config');
var Api_cluster = Database('Cluster');

//ORM(LOCAL)
// var Database = require("baciro-orm");
// var conf = {
// 	host : 'localhost',
// 	port : 3306,
// 	name : 'bachiro',
// 	user : 'root',
// 	pass : 'Pratamaws&123',
// 	type : 'mysql'
// };
// var db = new Database(conf, path.resolve('./schema.js'));
// var Api_user = db.model('User');
// var Api_cluster = db.model('Cluster');
// var Api_config = db.model('Config');

app.use (function(req,res,next){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.header("Access-Control-Allow-Methods", "DELETE, GET, POST, PUT, OPTIONS");
//  res.removeHeader("x-powered-by");
next();
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
var id = /^[0-9]*$/;

var Cluster = {
	get:{
		cluster : function getCluster(req, res){
			var ipAddres = req.connection.remoteAddress;
			var apikey = req.params.apikey;
			var ipAddresHeader = req.headers.api;
        
	        //check ip dengan header
	        if (typeof ipAddresHeader !== 'undefined') {
	          ipAddres = ipAddresHeader;          
	        }

			checkApikey(apikey, ipAddres, function(result){
				if(result.err_code == 0){
					var cluster_id = req.params.cluster_id;
					if(typeof cluster_id !== 'undefined'){
						if(id.test(cluster_id)){
                  		//query mencari user berdasarkan id
	                  		Api_cluster.findById({"cluster_id": cluster_id}, function(err,data){
	                  		if(err){
	                  			res.json(err);
	                  		}else{
	                      		//show data
	                      		if(data.length>0){
	                      			showCluster(data,function(dataCluster){
	                      				res.json({"err_code" : 0, "data" : dataCluster});
	                      			});
	                      		}else{
	                      			res.json({"err_code" : 2, "err_msg": "cluster ID is not found"});
	                      		}
	                    	}
	                		});
            			}else{
            				res.json({"err_code" : 2, "err_msg": "Cluster ID must be numeric"});
            			}
          			}else{
          				//query mencari semua cluster
          				Api_cluster.find({}, function (err, data) {
          					if(err){
          						if(data.errcode==1)
          							res.json(data);
          						else
          							res.json(err);
          					}else{
								//cek jumdata dulu
            					if(data.length > 0){
	              				//show data
	              					showCluster(data,function(dataCluster){
	              						res.json({"err_code": 0, "data":dataCluster});
	              					});
                				}else{
                					res.json({"err_code": 4, "err_msg": "Data Cluster is empty", "application": "Api cluster", "function": "getCluster"});
                				}
              				}
          				});
          			}
	      		}else{
	      			result.err_code = 500;
	      			res.json(result);
	      		}
  			});
		},
		cluster_config: function getClusterConfig(req, res){
			var ipAddres = req.connection.remoteAddress;
			var apikey = req.params.apikey;
			var ipAddresHeader = req.headers.api;
        
	        //check ip dengan header
	        if (typeof ipAddresHeader !== 'undefined') {
	          ipAddres = ipAddresHeader;          
	        }

			checkApikey(apikey, ipAddres, function(result){
				if(result.err_code == 0){
					//proses query ambil data project
					var cluster_id = req.params.cluster_id;
					var config_id = req.params.config_id;

					if(typeof cluster_id !== 'undefined'){
						if(id.test(cluster_id)){
							if(typeof config_id !== 'undefined'){
								if(id.test(config_id)){
									//check cluster id
									Api_cluster.findById({"cluster_id": cluster_id}, function(err,data){
										if(err){
											res.json(err);
										}else{
											if(data.length>0){
												//check config_id
												Api_config.findWhereAnd([{"config_id": config_id},{"config_cluster_id": cluster_id}],function(err,data){
													if(err){
														res.json(err);
													}else{
														if(data.length>0){
															//show cluster and config from their ID 
															Api_config.findJoin({"config_id": config_id}, {Cluster : "config_cluster_id"}, function(err,data){
																if(err){
																	res.json(err);
																}else{
	                  						 					  //show data
						                  						  if(data.length>0){
						                  						  	var JOIN = {};
						                  						  	JOIN.cluster_id = data[0].Cluster.cluster_id.toString();
						                  						  	JOIN.cluster_name = data[0].Cluster.cluster_name.toString();
						                  						  	JOIN.cluster_status = data[0].Cluster.cluster_status;
						                  						  	JOIN.config_id = data[0].config_id;
						                  						  	JOIN.config_key = data[0].config_key;
						                  						  	JOIN.config_value = data[0].config_value;
						                  						  	JOIN.config_create_date = data[0].config_create_date;
						                  						  	JOIN.config_update_date = data[0].config_update_date;

																		//convert date
												                    	JOIN.config_create_date = JOIN.config_create_date.slice(0,19).replace('T',' ');
												                    	if(JOIN.config_update_date!==null)
												                    		JOIN.config_update_date = JOIN.config_update_date.slice(0,19).replace('T',' ');
												                    	else
												                    		JOIN.config_update_date="null";
												                    	res.json({"err_code" : 0, "data" : [JOIN]});
												                    }else{
												                    	res.json({"err_code" : 3, "err_msg": "Configuration is not found in this cluster"});
												                    }
												                }
												            });
														}else
															res.json({"err_code":4, "err_msg": "Configuration is not found in this cluster"})
													}
												})
											}else
												res.json({"err_code":5,"err_msg": "Cluster ID is not found" })
										}
									})
								}else{
									res.json({"err_code" : 6, "err_msg" : "Config ID must be numeric"});
								}
							}else{
								//show cluster and its config from cluster id 
								Api_cluster.findJoin({"cluster_id": cluster_id}, {Config : "config_cluster_id"}, function(err,data){
									if(err){
										if(data.errcode==1)
											res.json(data);
										else
											res.json(err);
									}else{
						         	  	
						         	  	if(data.length > 0){
						                    //take necessary data
						                    var JOIN = {"err_code" : 0, "data" : []};
						                    var count = 0;
						                    for(key in data){
						                    	if(typeof data[key].Configs[0]!=='undefined'){
						                    		for(key1 in data[key].Configs){
						                    			JOIN.data[count] = {
						                    				"cluster_id": data[key].cluster_id,
						                    				"cluster_name": data[key].cluster_name,
						                    				"cluster_status": data[key].cluster_status
														};
								                    
						                          	JOIN.data[count].config_id = data[key].Configs[key1].config_id;
						                          	JOIN.data[count].config_key = data[key].Configs[key1].config_key;
						                          	JOIN.data[count].config_value = data[key].Configs[key1].config_value;
						                          	JOIN.data[count].config_create_date = data[key].Configs[key1].config_create_date;
						                          	JOIN.data[count].config_update_date = data[key].Configs[key1].config_update_date;

						                          	JOIN.data[count].config_create_date = JOIN.data[count].config_create_date.slice(0,19).replace('T',' ');
						                          	if(JOIN.data[count].config_update_date!==null)
						                          		JOIN.data[count].config_update_date = JOIN.data[count].config_update_date.slice(0,19).replace('T',' ');
						                          	else
						                          		JOIN.data[count].config_update_date="null";
						                          	count++;
								                    }
								                }else{
								                  	JOIN.data[count] = {
								                  		"cluster_id": data[key].cluster_id,
								                  		"cluster_name": data[key].cluster_name,

								                  	};
								                  	JOIN.data[count].config_id = "null";
								                  	JOIN.data[count].config_key = "null";
								                  	JOIN.data[count].config_value = "null";
								                  	JOIN.data[count].config_create_date= "null";
								                  	JOIN.data[count].config_update_date= "null";
								                  	count++;
								                }
								            }res.json(JOIN);
										}else{
										    res.json({"err_code" : 2, "err_msg": "Cluster ID not found"});
										}
					      			}
					  			});
							}
						}else
							res.json({"err_code" : 3, "err_msg" : "Cluster ID must be numeric"});
					}else{
						res.json({"err_code": 2, "err_msg": "Please select a cluster"});
					}
				}else{
					result.err_code = 500;
					res.json(result);
				}
			});
		}
	},

	post: {
		cluster: function addCluster(req, res){
		if(Object.keys(req.body).length){
			var ipAddres = req.connection.remoteAddress;
			var apikey = req.params.apikey;
			var cluster_name = req.body.cluster_name;
			var cluster_status = req.body.cluster_status;
			var ipAddresHeader = req.headers.api;
        
	        //check ip dengan header
	        if (typeof ipAddresHeader !== 'undefined') {
	          ipAddres = ipAddresHeader;          
	        }

			checkApikey(apikey, ipAddres, function(result){
				if(result.err_code == 0){
					//check name cannot empty
					if(typeof req.body.cluster_name !== 'undefined' && req.body.cluster_name !== ""){
					//check cluster name 
					checkClusterName(apikey, cluster_name, cluster_status,function(result2){
						if(result2.err_code == 0){							
							if(typeof req.body.cluster_status !== 'undefined' && req.body.cluster_status !== ""){														
							//get last Id
							getClusterId(apikey, function(result3){
								if(result3.err_code == 0){
									
									if(result2.default_status){
										updateConfigDefault(apikey,function(result4){});
										cluster_status = req.body.cluster_status;
									}else{
										cluster_status = req.body.cluster_status;
									}
									var dataCluster = {
										"cluster_id": result3.cluster_id,
										"cluster_name": cluster_name,
										"cluster_status": cluster_status,
										"cluster_create_date": getFormattedDate(),
									};
									//save data cluster to database
									Api_cluster.add(dataCluster, function(err,data){
										if(err){
											res.json({"err_code": 1, "err_msg": err, "application": "Api project", "function": "addProject"});
										}else{
									  	//check is there any error or not
									  	if(data.errcode == 0){
									  		//show data cluster that have been added
									  		Api_cluster.findById({"cluster_id" : result3.cluster_id},function(err,datapost){
									  			if(datapost[0].cluster_status=="")
									  				datapost[0].cluster_status="null";
									  			datapost[0].cluster_create_date = datapost[0].cluster_create_date.slice(0,19).replace('T',' ');
									  			if(datapost[0].cluster_update_date!==null)
									  				datapost[0].cluster_update_date = datapost[0].cluster_update_date.slice(0,19).replace('T',' ');
									  			else
									  				datapost[0].cluster_update_date="null";
									  			res.json({"err_code": 0, "data" : datapost});
									  		});
									  	}else{
									  		res.json(data);
									  	}
									  }
									})
								}else{
									result.err_code = 500;
									res.json(result3);
								}
							});
							}else{
						res.json({"err_code" : 1, "err_msg" : "Cluster status is required"});
						}
								
						}else{
							result.err_code = 500;
							res.json(result2);
						}
					});
					}else{
						res.json({"err_code" : 1, "err_msg" : "Cluster name is required"});
						}

				}else{
					result.err_code = 500;
					res.json(result);
				}
			});
		}else
			res.json({"err_code": 500, "err_msg": "Body cannot empty"});
		},
		cluster_config: function addClusterConfig(req, res){
			var ipAddres = req.connection.remoteAddress;
			var apikey = req.params.apikey;
			var cluster_id = req.params.cluster_id;
			var config_key = req.body.config_key;
			var config_value = req.body.config_value;
			var ipAddresHeader = req.headers.api;
        
	        //check ip dengan header
	        if (typeof ipAddresHeader !== 'undefined') {
	          ipAddres = ipAddresHeader;          
	        }

			checkApikey(apikey, ipAddres, function(result){
				if(result.err_code == 0){
					//config key cannot emtpy
					if(typeof req.body.config_key!=='undefined'&& req.body.config_key!==""){
						//check config value cannot empty
						if(typeof req.body.config_value!=='undefined'&& req.body.config_value!==""){
							//cek config key sudah ada belum
							checkConfigKey(apikey, cluster_id, config_key,function(result2){
								if(result2.err_code == 0){
									//get last config id
									getConfigId(apikey, function(result3){
										if(result3.err_code == 0){
											//susun body
											var dataConfig = {
												"config_id": result3.config_id,
												"config_key": config_key,
												"config_value": config_value,
												"config_create_date": getFormattedDate(),
												"config_cluster_id" : cluster_id
											};
											//save data config on involved cluster
											Api_config.add(dataConfig,function(err, data){
												if(err){
													res.json({"err_code": 1, "err_msg": err, "application": "Api cluster", "function": "addClusterConfig"});
												}else{
												  	if(data.errcode == 0){
												  		Api_config.findJoin({"config_id": result3.config_id}, {Cluster : "config_cluster_id"}, function(err,datapost){
												  			//show data config that have been added;
												  			if(err){
																	res.json(err);
												  			}else{
					                						  if(datapost.length>0){
					                						  	var JOIN = {};
					                						  	JOIN.cluster_id = datapost[0].Cluster.cluster_id.toString();
					                						  	JOIN.cluster_name = datapost[0].Cluster.cluster_name.toString();
					                						  	JOIN.cluster_status = datapost[0].Cluster.cluster_status;
					                						  	JOIN.config_id = datapost[0].config_id;
					                						  	JOIN.config_key = datapost[0].config_key;
					                						  	JOIN.config_value = datapost[0].config_value;
					                						  	JOIN.config_create_date = datapost[0].config_create_date;
					                						  	JOIN.config_update_date = datapost[0].config_update_date;
										                    	//convert date
										                    	JOIN.config_create_date = JOIN.config_create_date.slice(0,19).replace('T',' ');
										                    	if(JOIN.config_update_date!==null)
										                    		JOIN.config_update_date = JOIN.config_update_date.slice(0,19).replace('T',' ');
										                    	else
										                    		JOIN.config_update_date="null";
										                    	res.json({"err_code" : 0, "data" : [JOIN]});
										                   		}else{
										                    		res.json({"err_code" : 2, "err_msg": "Cluster ID is not found"});
										                    	}
											                }
											            });
													}else{
														res.json(data);
												 	}
												}
											});
										}else{
											result.err_code = 500;
											res.json(result3);
										}
									});
								}else{
									result.err_code = 500;
									res.json(result2);
								}
							})
						}else
						res.json({"err_code" : 1, "err_msg" : "Configuration value is required"})
					}else
					res.json({"err_code" : 1, "err_msg" : "Configuration key is required"})
				}else{
					result.err_code = 500;
					res.json(result);
				}
			});
		}
	},
	put: {
		cluster: function updateCluster(req, res){
		if(Object.keys(req.body).length){
			var ipAddres = req.connection.remoteAddress;
			var apikey = req.params.apikey;
			var cluster_id = req.params.cluster_id;
			var cluster_name = req.body.cluster_name;
			var cluster_status = req.body.cluster_status;
			var ipAddresHeader = req.headers.api;
        
	        //check ip dengan header
	        if (typeof ipAddresHeader !== 'undefined') {
	          ipAddres = ipAddresHeader;          
	        }

			checkApikey(apikey, ipAddres, function(result){
				if(result.err_code == 0){
					if(typeof cluster_id !== 'undefined'&&id.test(cluster_id)){								
					//check cluster id is exist or not
					Api_cluster.findById({"cluster_id": cluster_id},function(err,data){
						if(err){
							res.json(err);
						}else{									
							if(data.length>0){		
								var dataCluster = {};
								dataCluster.cluster_update_date = getFormattedDate();

								if(typeof req.body.cluster_name !== 'undefined' && req.body.cluster_name !== ""){
									dataCluster.cluster_name = req.body.cluster_name;
									if(typeof req.body.cluster_status !== 'undefined' && req.body.cluster_status !== ""){	
									dataCluster.cluster_status = req.body.cluster_status;									
										//update data cluster to database	
										Api_cluster.update({"cluster_id": cluster_id},dataCluster, function(err,data){
											if(err){
												if(data.errcode==1){
													res.json({"err_code": 3, "err_msg": "Cluster ID is not found"});
													}else{
														res.json(err);
													}
											}else{
											//show updated cluster
											Api_cluster.findById({"cluster_id": cluster_id}, function(err,dataUpdate){
												showCluster(dataUpdate,function(dataCluster){
                                				res.json({"err_code" : 0, "data" : dataCluster});                                				
                              					});																			
											});
											}
										});																														
									}else{										
									res.json({"err_code" : 1, "err_msg" : "Cluster status is required"});
									}									
								}else{									
								res.json({"err_code" : 1, "err_msg" : "Cluster name is required"});
								}
							
							}else{
							res.json({"err_code": 3, "err_msg" : "Cluster ID is not found"})
							}
						}
					});
						}else{
							res.json({"err_code": 3, "err_msg": "Cluster ID must be numeric"});
						}
					}else{
					result.err_code = 500;
					res.json(result);
				}
			});
		}else{
			res.json({"err_code" : 4, "err_msg": "Body cannot empty"})
		}
		},
		cluster_config: function updateClusterConfig(req, res){
			var ipAddres = req.connection.remoteAddress;
			var apikey = req.params.apikey;
			var cluster_id = req.params.cluster_id;
			var config_id = req.params.config_id;
			var config_key = req.body.config_key;
			var config_value = req.body.config_value;
			var ipAddresHeader = req.headers.api;
        
	        //check ip dengan header
	        if (typeof ipAddresHeader !== 'undefined') {
	          ipAddres = ipAddresHeader;          
	        }

			checkApikey(apikey, ipAddres, function(result){
				if(result.err_code == 0){
					if(typeof cluster_id!=='undefined'&&id.test(cluster_id)){
						Api_cluster.findById({"cluster_id":cluster_id},function(err,data){
							if(err){
								res.json(err);
							}else{
								if(data.length>0){
									if(typeof config_id!=='undefined'&&id.test(config_id)){
										Api_config.findById({"config_id":config_id},function(err,data){
											if(err){
												res.json(err);
											}else{
												if(data.length>0){
													//susun body
													var dataConfig = {};
													dataConfig.config_update_date = getFormattedDate();
													if(typeof req.body.config_key!== 'undefined'&&req.body.config_key!==""){
														dataConfig.config_key = req.body.config_key
														if(typeof req.body.config_value!== 'undefined'&&req.body.config_value!==""){
															dataConfig.config_value = req.body.config_value
															Api_config.update({"config_id": config_id}, dataConfig,function(err,data){
																if(err){
																	if(data.errcode==1)
																		res.json({"err_code": 1, "err_msg": "Configuration is not found in this cluster"});
																	else
																	res.json(err);
																}else{
																	Api_config.findJoin({"config_id": config_id}, {Cluster : "config_cluster_id"}, function(err,dataUpdate){
																		//console.log(dataUpdate);
																		if(err){
																			res.json(err);
																		}else{
			                  						  						//show data
							                  						  		if(dataUpdate.length>0){
									                  						  	var JOIN = {};
									                  						  	JOIN.cluster_id = dataUpdate[0].Cluster.cluster_id.toString();
									                  						  	JOIN.cluster_name = dataUpdate[0].Cluster.cluster_name.toString();
									                  						  	JOIN.cluster_status = dataUpdate[0].Cluster.cluster_status;
									                  						  	JOIN.config_id = dataUpdate[0].config_id;
									                  						  	JOIN.config_key = dataUpdate[0].config_key;
									                  						  	JOIN.config_value = dataUpdate[0].config_value;
									                  						  	JOIN.config_create_date = dataUpdate[0].config_create_date;
									                  						  	JOIN.config_update_date = dataUpdate[0].config_update_date;
																										//convert date
															                    JOIN.config_create_date = JOIN.config_create_date.slice(0,19).replace('T',' ');
															                    if(JOIN.config_update_date!==null)
															                    	JOIN.config_update_date = JOIN.config_update_date.slice(0,19).replace('T',' ');
															                    else
															                    	JOIN.config_update_date="null";
															                    res.json({"err_code" : 0, "data" : [JOIN]});
															                }
													              		}
													            	});
																}
															});
														}else{															
															res.json({"err_code": 3, "err_msg": "Configuration value is required"});
														}
													}else
														res.json({"err_code": 3, "err_msg": "Configuration key is required"});
												}else{
													res.json({"er_code": 6, "err_msg": "Configuration is not found in this cluster"})
												}
											}
										});
									}else
										res.json({"err_code": 3, "err_msg": "Config ID must be numeric"});
								}else{
									res.json({"err_code": 1, "err_msg": "Cluster ID is not found"});
								}
							}
						});
					}else
						res.json({"err_code": 3, "err_msg": "Cluster ID must be numeric"});
				}else{
					result.err_code = 500;
					res.json(result);
				}
			});
		}
	},
	delete: {
		cluster: function deleteCluster(req, res){
			var ipAddres = req.connection.remoteAddress;
			var apikey = req.params.apikey;
			var ipAddresHeader = req.headers.api;
        
	        //check ip dengan header
	        if (typeof ipAddresHeader !== 'undefined') {
	          ipAddres = ipAddresHeader;          
	        }

			checkApikey(apikey, ipAddres, function(result){
				if(result.err_code == 0){
					var cluster_id = req.params.cluster_id;
					if(typeof cluster_id !== 'undefined'&&id.test(cluster_id)){
						Api_cluster.delete([{"cluster_id": cluster_id}], function (err,data){
							if(err){
								if(data.errcode==1)
									res.json({"err_code": 2,"err_msg": "Cluster ID is not found"});
								else
						  			res.json(err);
							}else{
								Api_config.delete([{"config_cluster_id": cluster_id}],function(err,data){
									if(err){
										if(data.errcode==1){
											res.json({"err_code":0, "status": "Cluster has been deleted"});
										}else
							  				res.json(err);//cek apakah ada error atau tidak
						  		}else{
										res.json({"err_code": 0, "status": "Cluster and its configuration has been deleted"});
						  		}
						  	});
								//update user_cluster_id to null, because the cluster has been deleted
								Api_user.update({"user_cluster_id":cluster_id},{"user_cluster_id": null}, function(err,data){})
							}
						});
					}else{
						res.json({"err_code": 3, "err_msg": "Cluster ID must be numeric"});
					}
				}else{
					result.err_code = 500;
					res.json(result);
				}
			});
		},
		cluster_config: function deleteClusterConfig(req, res){
			var ipAddres = req.connection.remoteAddress;
			var apikey = req.params.apikey;
			var ipAddresHeader = req.headers.api;
        
	        //check ip dengan header
	        if (typeof ipAddresHeader !== 'undefined') {
	          ipAddres = ipAddresHeader;          
	        }

			checkApikey(apikey, ipAddres, function(result){
				if(result.err_code == 0){
					var cluster_id = req.params.cluster_id;
					var config_id = req.params.config_id;

					if(typeof cluster_id !== 'undefined'&&id.test(cluster_id)){
						if(typeof config_id !== 'undefined'){
							if(id.test(config_id)){
								Api_cluster.findById({"cluster_id":cluster_id}, function(err,data){
									if(err)
										res.json({"err_code":2, "err_msg": "Cluster is not found"});
									else{
										if(data.length>0){
											Api_config.findWhere([{"config_id": config_id},{"config_cluster_id": cluster_id}],function(err,data){
												if(err)
													res.json({"err_code": 3, "err_msg": "Config ID not found"});
												else{
													if(data.length>0){
														Api_config.delete([{"config_id": config_id}], function (err,data) {
															if(err){
																if(data.errcode==1)
																	res.json({"err_code":1,"err_msg": "Config ID is not found"});
																else
																	res.json(err);
															}else{
																res.json({"err_code": 0, "status": "Configuration has been deleted"})
															}
														});
													}else{
														res.json({"err_code": 9, "err_msg":"Configuration is not found in this cluster"});
													}
												}
											})
										}else{
											res.json({"err_code":10, "err_msg":"Cluster ID is not found"});
										}
									}
								})
							}else
								res.json({"err_code": 3, "err_msg": "Config ID must be numeric"});
						}else{
							Api_config.delete([{"config_cluster_id": cluster_id}], function (err, data) {
								if(err){
									if(data.errcode==1)
										res.json({"err_code": 1, "err_msg": "Cluster ID is not found"});
									else
										res.json(err);
									}else{
										res.json({"err_code": 0, "status": "All configuration has been deleted from this cluster"})
									}
							});
						}
					}else{
						res.json({"err_code": 3, "err_msg": "Cluster ID must be numeric"});
					}
				}else{
					result.err_code = 500;
					res.json(result);
				}
			});
		}
	}
}

function showCluster(data,callback){
	var dataCluster = [];
	for(key in data){
		if(data[key].cluster_status=="")
			data[key].cluster_status="null";
		data[key].cluster_create_date = data[key].cluster_create_date.slice(0,19).replace('T',' ');
		if(data[key].cluster_update_date!==null)
			data[key].cluster_update_date = data[key].cluster_update_date.slice(0,19).replace('T',' ');
		else
			data[key].cluster_update_date="null";
		if(data[key].cluster_status==null)
			data[key].cluster_status="null";

		dataCluster[key] = {
			"cluster_id" : data[key].cluster_id,
			"cluster_name" : data[key].cluster_name,
			"cluster_status" : data[key].cluster_status,
			"cluster_create_date" : data[key].cluster_create_date,
			"cluster_update_date" : data[key].cluster_update_date,

		};
	} callback(dataCluster)
}

function checkApikey(apikey, ipAddres, callback){
	//method, endpoint, params, options, callback
	Api_user.findWhere({"user_apikey" : apikey}, function(err, data){
		if(err){
			x(err);
		}else{
			if(data.length>0){
				if(data[0].user_id==1){
					x({"err_code": 0, "status": "root"});
				}else{
					if(apikey==data[0].user_apikey){
						dataIpAddress = data[0].user_ip_address;
						if(dataIpAddress.indexOf(ipAddres)>=0){
							if(data[0].user_is_active){
								x({"err_code": 0, "status": "active"});
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

	function x(result){
		callback(result)
	}
}

function checkClusterName(apikey, cluster_name, cluster_status, callback){
	//method, endpoint, params, options, callback
	Api_cluster.find({}, function (err,data) {
		if(err){
			x(err);
		}else{			
			if(data.length > 0){				
				var status = false;
			//	var status2 = false;
				for(i=0; i<data.length; i++){
					if(data[i].cluster_name.toString().toLowerCase() == cluster_name.toString().toLowerCase()){
						status = true;
					}					
				}
				if(status){
					x({"err_code": 2, "status": "Cluster name already exist"});
				}else{
					x({"err_code": 0, "status": "Cluster ready to use"});
				}
			}else{
				x({"err_code": 0, "status": "Cluster ready to use"});
			}
		}
	});

	function x(result){
		callback(result)
	}
}

function checkConfigKey(apikey, cluster_id, config_key, callback){
	//method, endpoint, params, options, callback
	Api_config.findWhereAnd([{"config_cluster_id": cluster_id},{"config_key": config_key }], function (err, data) {
		if(err){
			x(err);
		}else{
			if(data.length > 0){
				var status = false;
				for(i=0; i<data.length; i++){
					if(data[i].config_key.toString().toLowerCase() == config_key.toString().toLowerCase()){
						status = true;
					}
				}
				if(status){
					x({"err_code": 2, "status": "Config key already exist"});
				}else{
					x({"err_code": 0, "status": "Config key ready to use"});
				}
			}else{
				x({"err_code": 0, "status": "Config key ready to use"});
			}
		}
	});

	function x(result){
		callback(result)
	}
}

function getFormattedDate() {
	var date = new Date();
	var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

	return str;
}

function getClusterId(apikey, callback){
	//method, endpoint, params, options, callback
	Api_cluster.findLastId('cluster_id', function (err,data) {
		console.log(data);
		if(err){
			x(err);
		}else{
			if(data.length > 0){
				var cluster_id = parseInt(data[0].cluster_id) + 1;
				x({"err_code": 0, "cluster_id": cluster_id});
			}else{
				x({"err_code": 0, "cluster_id": 1});
			}
		}

	});

	function x(result){
		callback(result)
	}
}

function getConfigId(apikey, callback){
	//method, endpoint, params, options, callback
	Api_config.findLastId('config_id', function (err,data ) {
		if(err){
			x(err);
		}else{
			if(data.length > 0){
				var config_id = parseInt(data[0].config_id) + 1;
				x({"err_code": 0, "config_id": config_id});
			}else{
				x({"err_code": 0, "config_id": 1});
			}
		}
	});

	function x(result){
		callback(result)
	}
}

function getUserByApikey(apikey, callback){
	//method, endpoint, params, options, callback
	Api_user.findWhere({"user_apikey": apikey}, function (err, data) {
		if(err){
			x(err);
		}else{
			if(data.length > 0){
				var user_firstname = data[0].user_firstname;
				var user_lastname = data[0].user_lastname;
				x({"err_code": 0, "user_firstname": user_firstname, "user_lastname": user_lastname});
			}else{
				x({"err_code": 2, "err_msg": "Apikey failed", "application": "Api project", "function": "getUserByApikey"});
			}
		}
	});

	function x(result){
		callback(result)
	}
}

function updateConfigDefault(apikey, callback){
	//method, endpoint, params, options, callback
	//console.log("APAPP");
	Api_cluster.findWhere({"cluster_status": "default"}, function (err, data) {
		if(err){
			x(err);
		}else{
	  	//config = JSON.parse(body);
	  	//cek apakah ada error atau tidak
	  	if(data.length>0){
	  		//console.log(data.length);
	  		var Data={
	  			"cluster_status" : "active"
	  		};

	  		for(i=0; i<=data.length;i++){
	  			Api_cluster.update({"cluster_id":data[i].cluster_id}, Data,function(err,data){
	  					//console.log(data);
	  					if(err){
	  						res.json(err);
	  					}
	  					else
	  						x({"err_code": 0, "err_msg": data});
	  				})

	  		}}else{
	  			x({"err_code": 1, "err_msg": err, "application": "Api cluster", "function": "updateConfigDefault"});
	  		}
	  	}
	  });

	function x(result){
		callback(result)
	}
}



//get method
app.get('/:apikey/cluster/:cluster_id?', Cluster.get.cluster);
app.get('/:apikey/cluster/:cluster_id?/config/:config_id?', Cluster.get.cluster_config);

//post method
app.post('/:apikey/cluster', Cluster.post.cluster);
app.post('/:apikey/cluster/:cluster_id?/config', Cluster.post.cluster_config);

//put method
app.put('/:apikey/cluster/:cluster_id?', Cluster.put.cluster);
app.put('/:apikey/cluster/:cluster_id?/config/:config_id?', Cluster.put.cluster_config);

//delete method
app.delete('/:apikey/cluster/:cluster_id?', Cluster.delete.cluster);
app.delete('/:apikey/cluster/:cluster_id?/config/:config_id?', Cluster.delete.cluster_config);



// var server = app.listen(8081, function () {
// 	var host = server.address().address
// 	var port = server.address().port
// 	console.log("Example app listening at http://%s:%s", host, port)
// })

var server = app.listen(port, host, function () {
	console.log("Server running at http://%s:%s", host, port);
})
