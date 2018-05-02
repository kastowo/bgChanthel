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
var host = configYaml.project.host;
var port = configYaml.project.port;
var data2xml = require('data2xml');
var convert = data2xml({xmlheader: '<?xml version="1.0" standalone="yes" ?>\n'});
var Api_user = Database('User');
var Api_inventory = Database('Inventory');
var Api_project = Database('Project');
var Api_group = Database('Group');
var Api_member = Database('Member');
var id = /^[0-9]*$/;
var aneh =/\s/g;

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
				projectByUser: function getProjectByUser(req, res){
					var ipAddres = req.connection.remoteAddress;
					var apikey = req.params.apikey;
					var ipAddresHeader = req.headers.api;
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }
					if(id.test(req.params.user_id)){
						//console.log(req.params.project_id);
					checkApikey(apikey, ipAddres, function(result){   
						if(result.err_code == 0){
							//proses query ambil data project
							var user_id = req.params.user_id;
								checkUserId(apikey, user_id, function(result2){
									if(result2.err_code == 0){									
										var project_id = req.params.project_id;
										var user_id = req.params.user_id;
										//console.log(result);
										if (result.status != 'root' && user_id != result.data[0].user_id) {
											res.json({"err_code" : 1, "err_msg" : "Access denied. Cannot access this project"});
										}else{
											if(typeof project_id !== 'undefined'){
												if(id.test(req.params.project_id)){
													Api_project.findWhereAnd([{"project_id": project_id},{"project_user_id": user_id}], function(err,data){									
													  if(err){
														res.json(err);
													  }else{								  	
														//show data
														if(data.length>0){
														  //convert date
														  	data[0].project_create_date = data[0].project_create_date.slice(0,19).replace('T',' ');
														  		if(data[0].project_update_date!==null)
																	data[0].project_update_date = data[0].project_update_date.slice(0,19).replace('T',' ');
																else
																data[0].project_update_date = "null";
														  	var newdata={"data" : []};
															for(key in data) {
																newdata.data[key] = {
																  "project_id": project_id,
																  "project_name":data[0].project_name,
																  "project_create_date": data[0].project_create_date,
																  "project_update_date": data[0].project_update_date,
																  "project_is_share": data[0].project_is_share,
																  "user_id": user_id
															  }											
																if(data[0].project_is_share == 1){
																	newdata.data[key].project_is_share = "true";
																}
																else{
																	newdata.data[key].project_is_share = "false";
																}
															}
															res.json({"err_code" : 0, "data" : newdata.data});
														}else{
														  res.json({"err_code" : 2, "err_msg": "Project is not found"});
														}                      
													  }
												  });
												}else{
													res.json({"err_code": 5, "err_msg": "Project ID must be numeric"});
												}
											}else{
												Api_project.findWhere({"project_user_id": user_id}, function(err,data){
			                   					 if(err){
													res.json(err);
												  }else{									  	
													//show data
													if(data.length>0){											
														//console.log(data);
														var newdata={"data" : []};
														for(key in data) {
															newdata.data[key] = {
															  "project_id": data[key].project_id,
															  "project_name":data[key].project_name,
															  "project_create_date": data[key].project_create_date,
															  "project_update_date": data[key].project_update_date,
															  "project_is_share": data[key].project_is_share,
															  "user_id": user_id
														  }
															//convert project is share
															if(newdata.data[key].project_is_share == 1)
															newdata.data[key].project_is_share = "true";
														else
															newdata.data[key].project_is_share = "false";
															 //convert date
															newdata.data[key].project_create_date = data[key].project_create_date.slice(0,19).replace('T',' ');
														  if(data[key].project_update_date!==null)
																newdata.data[key].project_update_date = data[key].project_update_date.slice(0,19).replace('T',' ');
															else
																newdata.data[key].project_update_date = "null";
														}											
														//console.log(newdata.data);
														res.json({"err_code" : 0, "data" : newdata.data});
													}else{
													  res.json({"err_code" : 2, "err_msg": "No project for this user"});
													}                      
												  }
											  	});

											}
										}
									}else{
										res.json(result2);
									}
								})
						}else{
							result.err_code = 500;
							res.json(result);
						}
					});
				}else{
						res.json({"err_code": 5, "err_msg": "User ID must be numeric"});
					}
				},
				projectByGroup: function getProjectByGroup(req, res){
					var ipAddres = req.connection.remoteAddress;
					var apikey = req.params.apikey;
					var ipAddresHeader = req.headers.api;
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }
					if(id.test(req.params.group_id)){
					checkApikey(apikey, ipAddres, function(result){
						if(result.err_code == 0){
							//proses query ambil data project
							var project_id = req.params.project_id;
							var group_id = req.params.group_id;
							if(typeof project_id !== 'undefined'){					
								if(id.test(req.params.project_id)){
								Api_project.findWhereAnd([{"project_id": project_id},{"project_group_id": group_id}], function(err,data){
									//console.log(data);
								  if(err){
									res.json(err);
								  }else{
									//show data
									if(data.length>0){
									  //convert date
									  data[0].project_create_date = data[0].project_create_date.slice(0,19).replace('T',' ');
									  if(data[0].project_update_date!==null){
											data[0].project_update_date = data[0].project_update_date.slice(0,19).replace('T',' ');
									  }
									  	else{
											data[0].project_update_date = "null";
									  	}
										var newdata={"data" : []};
										for(key in data) {
											newdata.data[key] = {
											  "project_id": project_id,
											  "project_name":data[0].project_name,
											  "project_create_date": data[0].project_create_date,
											  "project_update_date": data[0].project_update_date,
											  "project_is_share": data[0].project_is_share,
											  "group_id": data[0].project_group_id.toString()
										  }
										  //console.log(newdata.data);
											if(data[0].project_is_share.toString() == 1){
												newdata.data[key].project_is_share = "true";
											}
											else{
												newdata.data[key].project_is_share = "false";
											}
										}
										res.json({"err_code" : 0, "data" : newdata.data});
									}else{
									  res.json({"err_code" : 2, "err_msg": "Project is not found"});
									}                      
								  }
							  	});
								}else{
									res.json({"err_code": 5, "err_msg": "Project ID must be numeric"});
								}
							}else{
								Api_project.findWhere({"project_group_id": group_id}, function(err,data){
									//res.json(data1);
								  if(err){
									res.json(err);
								  }else{
									//show data
									  //console.log(data);
									if(data.length>0){
										showProjectbyGroup(data,function(dataGroup){
				                          res.json({"err_code" : 0, "data" : dataGroup});
				                        });										
									}else{
									  res.json({"err_code" : 2, "err_msg": "Project is not found"});
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
						res.json({"err_code": 5, "err_msg": "Group ID must be numeric"});
					}
				},
				inventory: function getInventory(req, res){
					var ipAddres = req.connection.remoteAddress;
					var apikey = req.params.apikey;
					var ipAddresHeader = req.headers.api;
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }
					if(id.test(req.params.project_id)){
					checkApikey(apikey, ipAddres, function(result){
						if(result.err_code == 0){
							//proses query ambil data project
							var project_id = req.params.project_id;
							var inventory_id = req.params.inventory_id;
							userIdApikey = result.data[0].user_id;
							//console.log(result);
							Api_project.findWhereAnd({"project_id": project_id, "project_user_id": userIdApikey},function(err,data){ 
								//console.log(data);
							if(err){
										if(data.errcode==1)
											res.json(data);
										else
											res.json(err);
									}else{									
										if(data.length > 0){
											if(typeof project_id !== 'undefined'){
								if(typeof inventory_id !== 'undefined'){
									if(id.test(req.params.project_id)){
									Api_inventory.findJoin({"inventory_id": inventory_id}, {Project : "project_inventory_id"}, function(err,data){
										//console.log(data);
										if(err){
										 res.json(err);
									  }else{
										//show data
										if(data.length>0){
										  var JOIN = [];
												JOIN[0] = {  
														"project_id": data[0].Project.project_id.toString(),
														"project_name": data[0].Project.project_name.toString(),
													};
												//JOIN.project_id= data[0].Project.project_id.toString(); 
												//JOIN.project_name= data[0].Project.project_name.toString();
											  	JOIN[0].inventory_id = data[0].inventory_id
											  	JOIN[0].inventory_name= data[0].inventory_name;
											  	JOIN[0].inventory_path= data[0].inventory_path;
											  	JOIN[0].inventory_type= data[0].inventory_type;
											  	JOIN[0].inventory_version= data[0].inventory_version;
												JOIN[0].inventory_create_date = data[0].inventory_create_date;;
	                    						JOIN[0].inventory_update_date = data[0].inventory_update_date;	
												JOIN[0].inventory_package= JSON.parse(Buffer.from(data[0].inventory_package, 'base64').toString('ascii'));
												//.replace('\"',''));
												//JOIN.inventory_package = JOIN.inventory_package.replace('\"','');
												//convert date
			                      				JOIN[0].inventory_create_date = JOIN[0].inventory_create_date.slice(0,19).replace('T',' ');
			                      					if(JOIN[0].inventory_update_date!==null)
			                      						JOIN[0].inventory_update_date = JOIN[0].inventory_update_date.slice(0,19).replace('T',' ');
													else
														JOIN[0].inventory_update_date = "null";
												if(JOIN[0].inventory_version == 1){		// add versioning
													JOIN[0].inventory_version = "true";
												}
												else{
													JOIN[0].inventory_version = "false";
												}
										  res.json({"err_code" : 0, "data" : JOIN});
											
											}else{
										  res.json({"err_code" : 2, "err_msg": "Project is not found"});
										}                      
									  }
								  });
										}else{
						res.json({"err_code": 5, "err_msg": "Project ID must be numeric"});
					}
								}else{
									Api_project.findJoin({"project_id" :project_id}, {Inventory : "project_inventory_id"}, function(err,data){
										if(err){
											if(data.errcode==1)
												res.json(data);
											else
												res.json(err);
										}else{
										  //cek jumdata dulu
										  if(data.length > 0){
											  if(data[0].Inventories.length > 0){												  
											//take necessary data
											var JOIN = [];										
												for(key in data[0].Inventories){													
												JOIN[key] = {  
													"project_id": data[0].project_id.toString(),
													"project_name": data[0].project_name.toString(),
												};
											  //selection data
											  if(typeof data[0].Inventories[key]!=='undefined'){												  																		  
												JOIN[key].inventory_id = data[0].Inventories[key].inventory_id;
											  	JOIN[key].inventory_name= data[0].Inventories[key].inventory_name;
											  	JOIN[key].inventory_path= data[0].Inventories[key].inventory_path;
											  	JOIN[key].inventory_type= data[0].Inventories[key].inventory_type;
											  	JOIN[key].inventory_version= data[0].Inventories[key].inventory_version;
												JOIN[key].inventory_create_date = data[0].Inventories[key].inventory_create_date;
	                    						JOIN[key].inventory_update_date = data[0].Inventories[key].inventory_update_date;	
												JOIN[key].inventory_package= data[0].Inventories[key].inventory_package;
												JOIN[key].inventory_package = JSON.parse(Buffer.from(JOIN[key].inventory_package, 'base64').toString('ascii'));
												
												//.replace('\"','');
												//JOIN[key].inventory_package = JOIN[key].inventory_package.replace('\"','');
												//convert date
			     								JOIN[key].inventory_create_date = JOIN[key].inventory_create_date.slice(0,19).replace('T',' ');
			                      					if(JOIN[key].inventory_update_date!== null)
			                      						JOIN[key].inventory_update_date = JOIN[key].inventory_update_date.slice(0,19).replace('T',' ');
												  else
													  JOIN[key].inventory_update_date = "null";
												if(JOIN[key].inventory_version == 1){		// add versioning
													JOIN[key].inventory_version = "true";
												}
												else{
													JOIN[key].inventory_version = "false";
												}
											  }else{
												JOIN[key].inventory_id = "null";
											  	JOIN[key].inventory_name= "null";
											  	JOIN[key].inventory_path= "null";
											  	JOIN[key].inventory_type= "null";
											  	JOIN[key].inventory_version= "null";
												JOIN[key].inventory_create_date = "null";
	                    						JOIN[key].inventory_update_date = "null";	
												JOIN[key].inventory_package= "null";
											  }
										  }
										  console.log("TARAAAAAAAAAAAAAAA . . . .");	
										  console.log(JOIN);									  
										  res.json({"err_code" : 0, "data": JOIN.sort(function(a, b) { return parseFloat(b.inventory_id) - parseFloat(a.inventory_id)})});
											  }else{
										res.json({"err_code": 5, "err_msg": "Inventory in this project is empty"});	
									  }
											  }else{
										res.json({"err_code": 2, "err_msg": "Project is not found"});	
									  }
								  }
							  });
								}
							}else{
											res.json({"err_code": 3, "err_msg": "No project is selected"});	
									}
										}else{
										checkProjectShare(apikey, project_id, userIdApikey, function(result5){
											if(result5.err_code == 0){
														if(typeof project_id !== 'undefined'){
								if(typeof inventory_id !== 'undefined'){
									if(id.test(req.params.project_id)){
									Api_inventory.findJoin({"inventory_id": inventory_id}, {Project : "project_inventory_id"}, function(err,data){										
										//console.log(data);
										if(err){
										 res.json(err);
									  }else{
										//show data
										if(data.length>0){
										  var JOIN = [];
												JOIN[0] = {  
														"project_id": data[0].Project.project_id.toString(),
														"project_name": data[0].Project.project_name.toString(),
													};
												//JOIN.project_id= data[0].Project.project_id.toString(); 
												//JOIN.project_name= data[0].Project.project_name.toString();
											  	JOIN[0].inventory_id = data[0].inventory_id;
											  	JOIN[0].inventory_name= data[0].inventory_name;
											  	JOIN[0].inventory_path= data[0].inventory_path;
											  	JOIN[0].inventory_type= data[0].inventory_type;
											  	JOIN[0].inventory_version= data[0].inventory_version;
												JOIN[0].inventory_create_date = data[0].inventory_create_date;
	                    						JOIN[0].inventory_update_date = data[0].inventory_update_date;	
												JOIN[0].inventory_package= JSON.parse(Buffer.from(data[0].inventory_package, 'base64').toString('ascii'));
												//.replace('\"',''));
												//JOIN.inventory_package = JOIN.inventory_package.replace('\"','');
												//convert date
			                      				JOIN[0].inventory_create_date = JOIN[0].inventory_create_date.slice(0,19).replace('T',' ');
			                      					if(JOIN[0].inventory_update_date!==null)
			                      						JOIN[0].inventory_update_date = JOIN[0].inventory_update_date.slice(0,19).replace('T',' ');
													else
														JOIN[0].inventory_update_date = "null";
													if(JOIN[0].inventory_version == 1){		// add versioning
														JOIN[0].inventory_version = "true";
													}
													else{
														JOIN[0].inventory_version = "false";
													}
										  res.json({"err_code" : 0, "data" : JOIN});
										}else{
										  res.json({"err_code" : 2, "err_msg": "Inventory is not found"});
										}                      
									  }
								  });
										}else{
						res.json({"err_code": 5, "err_msg": "Project ID must be numeric"});
					}
								}else{
									Api_project.findJoin({"project_id" :project_id}, {Inventory : "project_inventory_id"}, function(err,data){
										if(err){
											if(data.errcode==1)
												res.json(data);
											else
												res.json(err);
										}else{
										  //cek jumdata dulu
										  if(data.length > 0){
											  if(data[0].Inventories.length > 0){
											//take necessary data
											var JOIN = [];
										//	for(var key = data[0].Inventories.length-1;key>=0;key--){
												for(key in data[0].Inventories){
													
												JOIN[key] = {  
													"project_id": data[0].project_id.toString(),
													"project_name": data[0].project_name.toString(),
												};
											  //selection data
											  if(typeof data[0].Inventories[key]!=='undefined'){							 
												  //console.log(data[0].Inventories[key]);
												JOIN[key].inventory_id = data[0].Inventories[key].inventory_id;
											  	JOIN[key].inventory_name= data[0].Inventories[key].inventory_name;
											  	JOIN[key].inventory_path= data[0].Inventories[key].inventory_path;
											  	JOIN[key].inventory_type= data[0].Inventories[key].inventory_type;
											  	JOIN[key].inventory_version= data[0].Inventories[key].inventory_version;
												JOIN[key].inventory_create_date = data[0].Inventories[key].inventory_create_date;
	                    						JOIN[key].inventory_update_date = data[0].Inventories[key].inventory_update_date;	
												JOIN[key].inventory_package= data[0].Inventories[key].inventory_package;
												JOIN[key].inventory_package = JSON.parse(Buffer.from(JOIN[key].inventory_package, 'base64').toString('ascii'));
												
												//.replace('\"','');
												//JOIN[key].inventory_package = JOIN[key].inventory_package.replace('\"','');
												//convert date
			     								JOIN[key].inventory_create_date = JOIN[key].inventory_create_date.slice(0,19).replace('T',' ');
			                      					if(JOIN[key].inventory_update_date!== null)
			                      						JOIN[key].inventory_update_date = JOIN[key].inventory_update_date.slice(0,19).replace('T',' ');
												  else
													  JOIN[key].inventory_update_date = "null";
													if(JOIN[key].inventory_version == 1){		// add versioning
														JOIN[key].inventory_version = "true";
													}
													else{
														JOIN[key].inventory_version = "false";
													}
											  }else{
												JOIN[key].inventory_id = "null";
											  	JOIN[key].inventory_name= "null";
											  	JOIN[key].inventory_path= "null";
											  	JOIN[key].inventory_type= "null";
											  	JOIN[key].inventory_version= "null";
												JOIN[key].inventory_create_date = "null";
	                    						JOIN[key].inventory_update_date = "null";	
												JOIN[key].inventory_package= "null";
											  }
										  }
										  res.json({"err_code" : 0, "data": JOIN.sort(function(a, b) { return parseFloat(b.inventory_id) - parseFloat(a.inventory_id)})});
									  }else{
										res.json({"err_code": 5, "err_msg": "Inventory in this project is empty"});	
									  }
									  }else{
										res.json({"err_code": 2, "err_msg": "Project is not found"});	
									  }
								  }
							  });
								}
							}else{
								res.json({"err_code": 3, "err_msg": "No project is selected"});	
							}
						}else{
							res.json(result5);	
						}	
						})
						}
						}
						})							
						}else{
							result.err_code = 500;
							res.json(result);
						}
					});	
						}else{
						res.json({"err_code": 5, "err_msg": "Project ID must be numeric"});
					}
				},				
				download_inventory: function downloadInventory(req, res){
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
							var project_id = req.params.project_id;
							var inventory_id = req.params.inventory_id;
							
							userIdApikey = result.data[0].user_id;
							//check project dulu
							Api_project.findWhereAnd({"project_id": project_id, "project_user_id": userIdApikey},function(err,data){ 
							if(err){
										if(data.errcode==1)
											res.json(data);
										else
											res.json(err);
									}else{
							/*Api.get('projectByUser', {"apikey": apikey, "project_id": project_id, "user_id": userIdApikey}, {}, function(error, response, body){
								if(error){
							  	res.json({"err_code": 1, "err_msg": error, "application": "Api project", "function": "addInventory"});
							  }else{
							  	//cek apakah ada error atau tidak
							  	body = JSON.parse(body);*/												  		
								  	if(data.length > 0){
											if(typeof project_id !== 'undefined'){
												if(typeof inventory_id !== 'undefined'){
													Api_inventory.findWhere({"inventory_id": inventory_id},function(err,data){ 
														if(err){
															if(data.errcode==1)
																res.json(data);
															else
																res.json(err);
														}else{
													/*Api.get('inventory', {"apikey": apikey, "project_id": project_id, "inventory_id": inventory_id}, {}, function (error, response, body) {
													  if(error){
													  	res.json(error);
													  }else{
													  	var user = JSON.parse(body); //object
													  	//cek apakah ada error atau tidak*/
														  	//cek jumdata dulu
														  	if(data.length > 0){
														  		filepath = '/tmp/'+ data[0].inventory_name + '.' + data[0].inventory_type;
														  		
													  			//tulis file ke dir tsb
													  			var packageEncrypt = data[0].inventory_package;
													  			var packageDecrypt = new Buffer(packageEncrypt, 'base64').toString('ascii');
													  			var packageJson = JSON.parse(packageDecrypt);
													  			var packageXml = convert('BG', packageJson);

													  			packageXml = packageXml.replace('<BG>', '');
													  			packageXml = packageXml.replace('</BG>', '');
													  			filepackage = packageXml;
											  					fs.writeFile(filepath, filepackage,{mode:0o777}, function(err){
											  						if(err){
											  							res.json({"err_code": 12, "err_msg": err, "application": "Api generate jar", "function": "getGenerateJar"});
											  						}else{
											  							res.download(filepath);
											  						}
											  					})
														  	}else{
													  			res.json({"err_code": 2, "err_msg": "Inventory is not found"});	
														  	}
													  	
													  }
													});
												}else{
													res.json({"err_code": 4, "err_msg": "InventoryID is not found"});	
												}
											}else{
												res.json({"err_code": 3, "err_msg": "No project is selected"});	
											}
								  	}else{
											checkProjectShare(apikey, project_id, userIdApikey, function(result5){
												if(result5.err_code == 0){
														if(typeof project_id !== 'undefined'){
															if(typeof inventory_id !== 'undefined'){
													Api_inventory.findWhere({"inventory_id": inventory_id},function(err,data){ 
														if(err){
															if(data.errcode==1)
																res.json(data);
															else
																res.json(err);
														}else{
													/*Api.get('inventory', {"apikey": apikey, "project_id": project_id, "inventory_id": inventory_id}, {}, function (error, response, body) {
													  if(error){
													  	res.json(error);
													  }else{
													  	var user = JSON.parse(body); //object
													  	//cek apakah ada error atau tidak*/
														  	//cek jumdata dulu
														  	if(data.length > 0){
														  		filepath = '/tmp/'+ data[0].inventory_name + '.' + data[0].inventory_type;
														  		
													  			//tulis file ke dir tsb
													  			var packageEncrypt = data[0].inventory_package;
													  			var packageDecrypt = new Buffer(packageEncrypt, 'base64').toString('ascii');
													  			var packageJson = JSON.parse(packageDecrypt);
													  			var packageXml = convert('BG', packageJson);

													  			packageXml = packageXml.replace('<BG>', '');
													  			packageXml = packageXml.replace('</BG>', '');
													  			filepackage = packageXml;
											  					fs.writeFile(filepath, filepackage,{mode:0o777}, function(err){
											  						if(err){
											  							res.json({"err_code": 12, "err_msg": err, "application": "Api generate jar", "function": "getGenerateJar"});
											  						}else{
											  							res.download(filepath);
											  						}
											  					})
														  	}else{
													  			res.json({"err_code": 2, "err_msg": "Inventory is not found"});	
														  	}
													  	
													  }
													});
															
															}else{
																res.json({"err_code": 4, "err_msg": "InventoryID is not found"});					
															}
														}else{
															res.json({"err_code": 3, "err_msg": "No project is selected"});	
														}
												}else{
													res.json(result5);	
												}
											})  		
								  	}
							  	
							  }
							})
						}else{
							result.err_code = 500;
							res.json(result);
						}
					});	
				},
				projectInventoryByUser : function getProjectInventoryByUser(req, res) {
					var ipAddres = req.connection.remoteAddress;
					var apikey =  req.params.apikey;
					var ipAddresHeader = req.headers.api;
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }				
					if (id.test(req.params.user_id)) {
						checkApikey(apikey, ipAddres, function(result){							
							if (result.err_code == 0) {
								//console.log(result);
								var user_id = req.params.user_id;
								checkUserId(apikey, user_id, function(result2){
								if(result2.err_code == 0){
									if (result.status != 'root' && user_id != result.data[0].user_id) {
									res.json({"err_code": 1, "err_msg": "Access denied. Cannot access this project"});	
								}else{
									if (typeof user_id !== 'undefined') {
										Api_project.findWhere({"project_user_id" : user_id}, function(err, data){
											if (err) {
												res.json(err);
											}else{
												if (data.length > 0) {	
													Api_project.findJoin({"project_user_id" : user_id}, {Inventory : "project_inventory_id"}, function(err1, data1){
														console.log("sini dlu om");
														console.log(data1);	
														if (err1) {
															res.json(err);
														}else{
															if (data1.length > 0) {																							
																for (var i = 0; i < data1.length; i++) {												
																	for (var j = 0; j < data1[i].Inventories.length; j++) {
																		data1[i].project_create_date = data1[i].project_create_date.slice(0,19).replace('T',' ');
																		//project update
																		if(data1[i].project_update_date!==null)
																		data1[i].project_update_date = data1[i].project_update_date.slice(0,19).replace('T',' ');
																		else
																		data1[i].project_update_date = "null";
																		// project share
																		if(data1[i].project_is_share == 1){
																			data1[i].project_is_share = "true";																		
																		}else{
																			data1[i].project_is_share = "false";
																		}
																		//project group id
																		if(data1[i].project_group_id !==null)
																		data1[i].project_group_id
																		else
																		data1[i].project_group_id = "null"
																		//inventory create date
																		data1[i].Inventories[j].inventory_create_date = data1[i].Inventories[j].inventory_create_date.slice(0,19).replace('T',' ');
																		//inventory update date
																		if(data1[i].Inventories[j].inventory_update_date!==null)
																		data1[i].Inventories[j].inventory_update_date = data1[i].Inventories[j].inventory_update_date.slice(0,19).replace('T',' ');
																		else
																		data1[i].Inventories[j].inventory_update_date = "null";

																		if(data1[i].Inventories[j].inventory_version == 1){ // add versioning
																		 	data1[i].Inventories[j].inventory_version = "true";
																		 }else{
																			data1[i].Inventories[j].inventory_version = "false";
																		}
																		// inventory package pare
																		data1[i].Inventories[j].inventory_package = JSON.parse(Buffer.from(data1[i].Inventories[j].inventory_package, 'base64').toString('ascii'));		
																	}																																																		
																}		
																res.json({"err_code": 0, "data" : data1});					
															}else{
															res.json({"err_code": 2, "err_msg": "Project or User is not found"});
															}
										  				}																								
													});																		
												}else{
													res.json({"err_code": 2, "err_msg": "Project or User is not found"});
												}
											}
										});
									}else{
										res.json({"err_code": 2, "err_msg": "User id not found"});
									}
								}																	
								}else{
									res.json(result2);
								}
							})


								//

							}else{
								result.err_code = 500;
								res.json(result);
							}
						});
					}else{
						res.json({"err_code": 5, "err_msg": "User ID must be numeric"});
					}
				},
				inventoryByUser: function getInventoryByUser(req, res){
					var ipAddres = req.connection.remoteAddress;
					var apikey =  req.params.apikey;
					var ipAddresHeader = req.headers.api;
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }				
					if (id.test(req.params.user_id)) {
						checkApikey(apikey, ipAddres, function(result){							
							if (result.err_code == 0) {
								//console.log(result);
								var user_id = req.params.user_id;
								checkUserId(apikey, user_id, function(result2){
								if(result2.err_code == 0){
									if (result.status != 'root' && user_id != result.data[0].user_id) {
									res.json({"err_code": 1, "err_msg": "Access denied. Cannot access this project"});	
								}else{
									if (typeof user_id !== 'undefined') {
									Api_project.findWhere({"project_user_id" : user_id}, function(err, data0){
										
											if (err) {
												res.json(err);
											}else{
										Api_inventory.findGroupBy(['inventory_name'], function(err, data){
											console.log("sini dlu om");
											// res.send(data);
											if (err) {
												res.json(err);
											}else{
												console.log("sini . . .")
												Api_inventory.findWhere({"inventory_version" : 0}, function(err, data1){
													if (err) {
														res.json(err);
													}else{
														// res.send(data1)														
														if (data1.length > 0) {	
															Api_project.findJoinGroupBy({"project_user_id" : user_id}, {Inventory : "project_inventory_id"}, ['inventory_name'], function(err, data2){														
															// console.log(data1);	
																if (err) {
																	res.json(err);
																}else{
																	if (data2.length > 0) {																							
																		for (var i = 0; i < data2.length; i++) {												
																			for (var j = 0; j < data2[i].Inventories.length; j++) {

																				data2[i].project_create_date = data2[i].project_create_date.slice(0,19).replace('T',' ');
																				//project update
																				if(data2[i].project_update_date!==null)
																				data2[i].project_update_date = data2[i].project_update_date.slice(0,19).replace('T',' ');
																				else
																				data2[i].project_update_date = "null";
																				// project share
																				if(data2[i].project_is_share == 1)
																				data2[i].project_is_share = "true";																		
																				else
																				data2[i].project_is_share = "false";
																				//project group id
																				if(data2[i].project_group_id !==null)
																				data2[i].project_group_id
																				else
																				data2[i].project_group_id = "null"
																				//inventory create date
																				data2[i].Inventories[j].inventory_create_date = data2[i].Inventories[j].inventory_create_date.slice(0,19).replace('T',' ');
																				//inventory update date
																				if(data2[i].Inventories[j].inventory_update_date!==null)
																				data2[i].Inventories[j].inventory_update_date = data2[i].Inventories[j].inventory_update_date.slice(0,19).replace('T',' ');
																				else
																				data2[i].Inventories[j].inventory_update_date = "null";

																				if(data2[i].Inventories[j].inventory_version == 1){ // add versioning
																				 	data2[i].Inventories[j].inventory_version = "true";
																				 }else{
																					data2[i].Inventories[j].inventory_version = "false";
																				}
																				// inventory package pare
																				data2[i].Inventories[j].inventory_package = JSON.parse(Buffer.from(data2[i].Inventories[j].inventory_package, 'base64').toString('ascii'));		
																			}																																																		
																		}
																		res.json({"err_code": 0, "data" : data2});					
																	}else{
																	res.json({"err_code": 2, "err_msg": "Project or User is not found"});
																		}
												  				}																								
															});
														}else{
															res.json({"err_code": 2, "err_msg": "Project or User is not found"});
														}

													}


													});
												
											}
										});
										}
										});
									}else{
										res.json({"err_code": 2, "err_msg": "User id not found"});
									}
								}																	
								}else{
									res.json(result2);
								}
							})

							}else{
								result.err_code = 500;
								res.json(result);
							}
						});
					}else{
						res.json({"err_code": 5, "err_msg": "User ID must be numeric"});
					}
				}

			},
			post: {
				project: function addProject(req, res){
					if(Object.keys(req.body).length){
					var ipAddres = req.connection.remoteAddress;
					var apikey = req.params.apikey;
					var user_id = req.params.user_id;
					var project_name = req.body.project_name.trim();
							project_name = project_name.replace(/ /g,'');
							project_name = project_name.replace(/[^\w\s]/gi, '');
					var ipAddresHeader = req.headers.api;
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }
					checkApikey(apikey, ipAddres, function(result){
						if(result.err_code == 0){
							//cek id data user apakah sudah ada atau belum
							checkUserId(apikey, user_id, function(result){
										if(result.err_code == 0){
							//cek email data user apakah sudah ada atau belum
							checkProjectName(apikey, project_name, user_id, function(result2){
								if(result2.err_code == 0){																	
								if(project_name.length > 0){	
									//ambil id user terakhir
									getProjectId(apikey, function(result3){
										if(result3.err_code == 0){											
											//console.log(result3);
											//susun body
											var dataProject = {
												"project_id": result3.project_id,
												"project_name": project_name,
												"project_create_date": getFormattedDate(),
												"project_user_id":  user_id,
												"project_is_share": 0
											};
											
											//proses simpan data user
											//method, endpoint, params, options, callback
											Api_project.add(dataProject, function(err,data){
												if(err){
										  		res.json({"err_code": 1, "err_msg": err, "application":  "Api project", "function": "addProject"});
										  	}else{
										  	//cek apakah ada error atau tidak
										  	if(data.errcode == 0){
      									  		Api_project.findById({"project_id": result3.project_id}, function(err,datapost){
													var datapost2 = {
														"project_id": datapost[0].project_id,
														"project_name": datapost[0].project_name,
														"project_create_date": datapost[0].project_create_date,
														"project_update_date": datapost[0].project_update_date,
														"project_is_share": datapost[0].project_is_share,
														"user_id": datapost[0].project_user_id,
														"group_id": datapost[0].project_group_id 
													};
													
													if(datapost2.project_is_share)
														datapost2.project_is_share = "true";
													else{
														datapost2.project_is_share = "false";
													}
													if(datapost2.group_id == null)
														datapost2.group_id = "null";
                              					datapost2.project_create_date = datapost[0].project_create_date.slice(0,19).replace('T',' ');
                              						if(datapost[0].project_update_date!==null)
                                						datapost2.project_update_date = datapost[0].project_update_date.slice(0,19).replace('T',' ');
													else
														datapost2.project_update_date = "null";
													//console.log(datapost2)
                              							res.json({"err_code": 0, "data" : datapost2});
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
									res.json({"err_code": 2, "err_msg": "Project name is required"});
								}
								}else{
									result.err_code = 500;
									res.json(result2);
								}
							})
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
					}else{
						res.json({"err_code": 500, "err_code":"Body is empty"});
					}
				},
				inventory: function addInventory(req, res){
					if(Object.keys(req.body).length){
					var ipAddres = req.connection.remoteAddress;
					var apikey = req.params.apikey;
					var project_id = req.params.project_id;
					var inventory_name = req.body.inventory_name;
					var inventory_type = req.body.inventory_type;
						inventory_name = inventory_name.replace(/ /g,'');
						inventory_name = inventory_name.replace(/[^\w\s]/gi, '');
					var inventory_version = req.body.inventory_version; // add versioning
					var inventory_package = req.body.inventory_package;

					//encryption base64 encode
					//console.log(inventory_package);
					inventory_package = JSON.stringify(inventory_package);
					inventory_package = new Buffer(inventory_package).toString('base64');			

					var pacage = Buffer.from(inventory_package, 'base64').toString('ascii');
					var ipAddresHeader = req.headers.api;
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }					
					checkApikey(apikey, ipAddres, function(result){
						if(result.err_code == 0){
							userIdApikey = result.data[0].user_id;
							Api_project.findWhereAnd({"project_id": project_id, "project_user_id": userIdApikey},function(err,data){ 
							if(err){
								if(data.errcode==1){
									res.json(data);
								}
								else{
											res.json(err);
								}
							}else{
								if(data.length > 0){
									checkProjectId(apikey, project_id, function(result){
									if(result.err_code == 0){
										if(inventory_name.length > 0){
											//cek email data user apakah sudah ada atau belum
											checkInventoryName(apikey, inventory_name, project_id, function(result2){
												if(result2.err_code == 0){
												//ambil id user terakhir
													getInventoryId(apikey, function(result3){
													if(result3.err_code == 0){
														getUserByApikey(apikey, function(result4){
														//console.log(result4);
														if(result4.err_code == 0){
														//setting path --> /home/baciro/namauser/tahun/bulan/tanggal/file.xml
														//susun body
															if(result4.user_firstname != 'null' && result4.user_lastname != 'null'){
																var path = '/usr/share/baciro/inventory/'+ result4.user_firstname +'_'+ result4.user_lastname + '/' + inventory_type + '/';
															}else{
																var path = '/usr/share/baciro/inventory/'+ result4.user_firstname + '/' + inventory_type + '/';
															}
																var dataInventory = {
																	"inventory_id": result3.inventory_id,
																	"inventory_name": inventory_name.trim(),
																	"inventory_type": inventory_type,
																	"inventory_version": inventory_version,	// add versioning
																	"inventory_path": path,
																	"inventory_package": inventory_package,
																	"inventory_create_date": getFormattedDate(),
																	"project_inventory_id" : req.params.project_id
																};																
																if(dataInventory.inventory_version == 'true'){ // add versioning
																 	dataInventory.inventory_version = 1;
																 }else{
																	dataInventory.inventory_version = 0;
																}
															//proses simpan data user
															//method, endpoint, params, options, callback
														Api_inventory.add(dataInventory,function(err,data){
															if(err){															
																res.json({"err_code": 1, "err_msg": error, "application": "Api project", "function": "addInventory"});
													 		}else{
															//cek apakah ada error atau tidak
																if(data.errcode == 0){
																	for(i=0; i<data.length;i++){
														  				if(data[i].inventory_package != 'null'){
																  			var packageEncrypt = data[i].inventory_package;
																  			var packageDecrypt = new Buffer(packageEncrypt, 'base64').toString('ascii');
																  			var packageJSON = JSON.parse(packageDecrypt);
																  			data[i].inventory_package = packageJSON;
														  				}
																	}
																Api_inventory.findJoin({"inventory_id": result3.inventory_id}, {Project : "project_inventory_id"}, function(err,data){
																	if(err){
																	 res.json(err);
																	}else{
																		//show data
																		if(data.length>0){
																		  var JOIN = [];
																				JOIN[0] = {  
																						"project_id": data[0].Project.project_id.toString(),
																						"project_name": data[0].Project.project_name.toString(),
																					};																				
																			  	JOIN[0].inventory_id = data[0].inventory_id
																			  	JOIN[0].inventory_name= data[0].inventory_name;
																			  	JOIN[0].inventory_path= data[0].inventory_path;
																			  	JOIN[0].inventory_version= data[0].inventory_version;	// add versioning
																				JOIN[0].inventory_create_date = data[0].inventory_create_date;;
									                    						JOIN[0].inventory_update_date = data[0].inventory_update_date;	
																				JOIN[0].inventory_package= JSON.parse(Buffer.from(data[0].inventory_package, 'base64').toString('ascii'));
																				//convert date
											                      				JOIN[0].inventory_create_date = JOIN[0].inventory_create_date.slice(0,19).replace('T',' ');
											                      					if(JOIN[0].inventory_update_date!==null){
											                      						JOIN[0].inventory_update_date = JOIN[0].inventory_update_date.slice(0,19).replace('T',' ');
											                      					}
																					else{
																						JOIN[0].inventory_update_date = "null";
																					}
																					if(JOIN[0].inventory_version == 1){		// add versioning
																						JOIN[0].inventory_version = "true";
																					}
																					else{
																						JOIN[0].inventory_version = "false";
																					}
											  								res.json({"err_code" : 0, "data" : JOIN});
																		}else{
																		  res.json({"err_code" : 2, "err_msg": "Inventory is not found"});
																		}                      
									  								}
								  								});
																}else{
																	res.json(data);
																}
															}
														});
														}else{
															res.json({"err_code": 1, "err_msg": result4.err_msg, "application": "Api project", "function": "addInventory"})
														}
											});
										}else{
											res.json(result3);	
										}
									});
								}else{
									result.err_code = 500;
									res.json(result2);					
								}
							})
								}else{
								res.json({"err_code": 500, "err_code":"Inventory name is empty" });
								}
							}else{
							result.err_code = 500;
							res.json(result);
						}
							});	
										}else{
											checkProjectShare(apikey, project_id, userIdApikey, function(result5){
												if(result5.err_code == 0){
														checkProjectId(apikey, project_id, function(result){
								if(result.err_code == 0){
								if(inventory_name.length > 0){
							//cek email data user apakah sudah ada atau belum
							checkInventoryName(apikey, inventory_name, function(result2){
								if(result2.err_code == 0){
									//ambil id user terakhir
									getInventoryId(apikey, function(result3){
										if(result3.err_code == 0){
											getUserByApikey(apikey, function(result4){
												//console.log(result4);
												if(result4.err_code == 0){
													//setting path --> /home/baciro/namauser/tahun/bulan/tanggal/file.xml
													//susun body
													if(result4.user_firstname != 'null' && result4.user_lastname != 'null'){
														var path = '/usr/share/baciro/inventory/'+ result4.user_firstname +'_'+ result4.user_lastname + '/' + inventory_type + '/';
													}else{
														var path = '/usr/share/baciro/inventory/'+ result4.user_firstname + '/' + inventory_type + '/';
													}

													var dataInventory = {
														"inventory_id": result3.inventory_id,
														"inventory_name": inventory_name.trim(),
														"inventory_type": inventory_type,
														"inventory_version": inventory_version,	// add versioning
														"inventory_path": path,
														"inventory_package": inventory_package,
														"inventory_create_date": getFormattedDate(),
														"project_inventory_id" : req.params.project_id
													};							
													if(dataInventory.inventory_version == 'true'){	// add versioning
													 	dataInventory.inventory_version = 1;
													 }else{
														dataInventory.inventory_version = 0;
													}																																
					//proses simpan data user
													//method, endpoint, params, options, callback
														Api_inventory.add(dataInventory,function(err,data){
														if(err){															
														res.json({"err_code": 1, "err_msg": error, "application": "Api project", "function": "addInventory"});
													  }else{
														//cek apakah ada error atau tidak
														if(data.errcode == 0){
															for(i=0; i<data.length;i++){
														  		if(data[i].inventory_package != 'null'){
														  			var packageEncrypt = data[i].inventory_package;
														  			var packageDecrypt = new Buffer(packageEncrypt, 'base64').toString('ascii');
														  			var packageJSON = JSON.parse(packageDecrypt);
														  			data[i].inventory_package = packageJSON;
														  		}
															}
														Api_inventory.findJoin({"inventory_id": result3.inventory_id}, {Project : "project_inventory_id"}, function(err,data){
										//console.log(data);
										if(err){
										 res.json(err);
									  }else{
										//show data
										if(data.length>0){
										  var JOIN = [];
												JOIN[0] = {  
														"project_id": data[0].Project.project_id.toString(),
														"project_name": data[0].Project.project_name.toString(),
													};												
											  	JOIN[0].inventory_id = data[0].inventory_id
											  	JOIN[0].inventory_name= data[0].inventory_name;
											  	JOIN[0].inventory_path= data[0].inventory_path;
											  	JOIN[0].inventory_type= data[0].inventory_type;
											  	JOIN[0].inventory_version= data[0].inventory_version;	// add versioning
												JOIN[0].inventory_create_date = data[0].inventory_create_date;;
	                    						JOIN[0].inventory_update_date = data[0].inventory_update_date;	
												JOIN[0].inventory_package= JSON.parse(Buffer.from(data[0].inventory_package, 'base64').toString('ascii'));
												
												//convert date
			                      				JOIN[0].inventory_create_date = JOIN[0].inventory_create_date.slice(0,19).replace('T',' ');
			                      					if(JOIN[0].inventory_update_date!==null)
			                      						JOIN[0].inventory_update_date = JOIN[0].inventory_update_date.slice(0,19).replace('T',' ');
													else
														JOIN[0].inventory_update_date = "null";
													if(JOIN[0].inventory_version == 1){		// add versioning
														JOIN[0].inventory_version = "true";
													}
													else{
														JOIN[0].inventory_version = "false";
													}
										  res.json({"err_code" : 0, "data" : JOIN});
										}else{
										  res.json({"err_code" : 2, "err_msg": "Inventory is not found"});
										}                      
									  }
								  });											
														}else{
															res.json(data);
														}
													  }
													});
												}else{
													res.json({"err_code": 1, "err_msg": result4.err_msg, "application": "Api project", "function": "addInventory"})
												}
											})
										}else{
											res.json(result3);	
										}
									});
								}else{
									result.err_code = 500;
									res.json(result2);				
								}
							})
								}else{
								res.json({"err_code": 500, "err_code":"Inventory name is empty" });
								}
							}else{
							result.err_code = 500;
							res.json(result);
						}
							});
												}else{
													res.json(result5);	
												}
											})
										}
									}
							})
							
								}else{
							result.err_code = 500;
							res.json(result);
						}
					});					
				}else{
					res.json({"err_code": 500,"err_code": "Body is empty"});
				}
				}
			},	
			put: {
				projectByUser: function updateProjectByUser(req, res){
				if(Object.keys(req.body).length){
					var ipAddres = req.connection.remoteAddress;
					var apikey = req.params.apikey;
					var ipAddresHeader = req.headers.api;
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }

					checkApikey(apikey, ipAddres, function(result){
						if(result.err_code == 0){
							//proses query ambil data user
							var user_id = req.params.user_id;
							var project_id = req.params.project_id;
							console.log(result.status);
								if(result.status != 'root' && user_id != result.data[0].user_id){
								res.json({"err_code": 1, "err_msg": "Access denied. Cannot access this project"});	
							}else{
							checkUserId(apikey, user_id, function(result2){
								if(result2.err_code == 0){
									if(typeof project_id !== 'undefined'){
										checkProjectId(apikey, project_id, function(result3){
											//console.log(result3);
											if(result3.err_code == 0){
												//cek untuk data yang akan diupdate
												var dataProject = {};
												//console.log(typeof req.body.project_name);
												if(typeof req.body.project_name !== 'undefined'){
													dataProject.project_name = req.body.project_name.trim();
												}else{
													res.json({"err_code": 2, "err_msg": "Project name is empty"});
												}
												dataProject.project_update_date = getFormattedDate();
												Api_project.update({"project_id": project_id},dataProject,function(err,data){
											 	   if(err){
												   if(data.errcode==1)
													  res.json(data);
													else
													  res.json(err);
												 }else{
												   Api_project.findById({"project_id": project_id}, function(err,datapost){
													   var datapost2 = {
														"project_id": datapost[0].project_id,
														"project_name": datapost[0].project_name,
														"project_create_date": datapost[0].project_create_date,
														"project_update_date": datapost[0].project_update_date,
														"project_is_share": datapost[0].project_is_share,
														"user_id": datapost[0].project_user_id,
														"group_id": datapost[0].project_group_id
													};
													  datapost2.project_create_date = datapost[0].project_create_date.slice(0,19).replace('T',' ');
													  if(datapost[0].project_update_date!==null){
														datapost2.project_update_date = datapost[0].project_update_date.slice(0,19).replace('T',' ');
													   }else{
														datapost2.project_update_date = "null";
													   }
													   if(datapost[0].project_group_id!==null){
														datapost2.group_id = datapost[0].project_group_id;
													   }else{
														datapost2.group_id = "null";
													   }

													  res.json({"err_code": 0, "data" : datapost2});
												   });
												 }
											   });
												/*Api.put('projectByUser', {"apikey": apikey, "user_id": user_id, "project_id": project_id}, {body: dataProject, json:true}, function (error, response, body) {
												  if(error){
												  	res.json(error)
												  }else{
												  	if(body.err_code == 0){
													  	res.json({"err_code": 0, "data": body.data});
												  	}else{
												  		res.json({"err_code": 1, "err_msg": body.error, "application": "Api project", "function": "updateProjectByUser"});
												  	}
												  }
												});*/
											}else{
												res.json(result3);
											}
										})
									}else{
										res.json({"err_code": 3, "err_msg": "Project ID is not found"});
									}									
								}else{
									res.json(result2);
								}
							})
						}
						}else{
							result.err_code = 500;
							res.json(result);
						}
					});	
				}else{
					res.json({"err_code": 500,"err_code": "Body is empty"});
				}
				},
				projectShareGroup: function updateProjectShareGroup(req, res){
					var ipAddres = req.connection.remoteAddress;
					var apikey = req.params.apikey;
					var ipAddresHeader = req.headers.api;
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }
					if(Object.keys(req.body).length){
					checkApikey(apikey, ipAddres, function(result){
						if(result.err_code == 0){
							//proses query ambil data user
							var group_id = req.params.group_id;
							var project_id = req.params.project_id;
							userIdApikey = result.data[0].user_id;
							checkMemberGroup(apikey, userIdApikey, group_id, function(result4){
								//console.log(result4);
								if(result4.err_code == 0){
									checkGroupId(apikey, group_id, function(result2){
										//console.log(result2);
								if(result2.err_code == 0){
									if(typeof project_id !== 'undefined'){
										checkProjectId(apikey, project_id, function(result3){
											if(result3.err_code == 0){
												//cek untuk data yang akan diupdate
												var dataProject = {};
												var idshare;
												if(typeof req.body.project_is_share !== 'undefined'){
													if(req.body.project_is_share == 'true')
													 	idshare = 1;
													 else
														idshare = 0;
													dataProject.project_is_share = idshare;
													dataProject.project_group_id = req.params.group_id; 
												}							
												dataProject.project_update_date = getFormattedDate();

												Api_project.update({ "project_id": project_id},dataProject,function(err,data){													
											 	   if(err){
												   if(data.errcode==1)
													  res.json(data);
													else
													  res.json(err);
												 }else{
													 if(req.body.project_is_share == 'true'){	
													 dataProject.project_is_share	= "true";											 	
														res.json({"err_code": 0, "status" : " Project has been shared to group", "data" : dataProject}); 
														 }else{
														 	dataProject.project_is_share	= "false";
														res.json({"err_code": 0, "status" : "Project has been unshared to group", "data" : dataProject});
													}
												 }
											   });
												/*Api.put('projectShareGroup', {"apikey": apikey, "group_id": group_id, "project_id": project_id}, {body: dataProject, json:true}, function (error, response, body) {
												  if(error){
												  	res.json(error)
												  }else{
												  	if(body.err_code == 0){
												  		if(req.body.project_is_share == 'true'){
													  		res.json({"err_code": 0, "status": "Project have been share in group"});
												  		}else{
												  			res.json({"err_code": 0, "status": "Project have been unshare in group"});
												  		}
												  	}else{
												  		res.json({"err_code": 1, "err_msg": body.error, "application": "Api project", "function": "updateProjectByUser"});
												  	}
												  }
												});*/
											}else{
												res.json(result3);
											}
										})
									}else{
										res.json({"err_code": 3, "err_msg": "Project ID is not found"});
									}
								}else{
									res.json(result2)
								}
							})
								}else{
									res.json(result4)
								}
							})
						
						}else{
							result.err_code = 500;
							res.json(result);
						}
					});	
				}else{
					res.json({"err_code": 500,"err_code": "Body is empty"});
				}
				},
				iventoryByInventoryId: function updateInventoryByInventoryId(req, res){
					if(Object.keys(req.body).length){
					var ipAddres = req.connection.remoteAddress;
					var apikey = req.params.apikey;
					var ipAddresHeader = req.headers.api;
					var inventory_id = req.params.inventory_id;
					var project_id = req.params.project_id;

					var inventory_package = req.body.inventory_package;
					var inventory_version = req.body.inventory_version;		// add versioning

					inventory_package = JSON.stringify(inventory_package);
					inventory_package = new Buffer(inventory_package).toString('base64');			

					var pacage = Buffer.from(inventory_package, 'base64').toString('ascii');
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }
			        if(id.test(project_id)){
					checkApikey(apikey, ipAddres, function(result){
						if(result.err_code == 0){
							//console.log(result);
							//proses query ambil data user
							var inventory_id = req.params.inventory_id;
							var project_id = req.params.project_id;

							if(id.test(inventory_id)){
							checkInventoryId(apikey, inventory_id, function(result2){
								if(result2.err_code == 0){
									if(typeof project_id !== 'undefined'){
										checkProjectId(apikey, project_id, function(result3){
											//console.log(result3);
											if(result3.err_code == 0){
												//cek untuk data yang akan diupdate
												var dataInventory = {};
												if(typeof req.body.inventory_name !== 'undefined'){
													dataInventory.inventory_name = req.body.inventory_name.trim();
												}else{
													res.json({"err_code": 2, "err_msg": "Inventory name is empty"});
												}
												//console.log(dataInventory);
												dataInventory.inventory_update_date = getFormattedDate();
												dataInventory.inventory_name =req.body.inventory_name;
												dataInventory.inventory_type =req.body.inventory_type;
												dataInventory.inventory_version =req.body.inventory_version;
												if(dataInventory.inventory_version == 'true'){ // add versioning
												 	dataInventory.inventory_version = 1;
												 }else{
													dataInventory.inventory_version = 0;
												}
												dataInventory.inventory_path =req.body.inventory_path;
												dataInventory.inventory_package =inventory_package;

												Api_inventory.update({"inventory_id": inventory_id},dataInventory,function(err,data){
												 	if(err){
													   if(data.errcode==1)
														  res.json(data);
														else
														  res.json(err);
													 }else{
													   Api_inventory.findById({"inventory_id": inventory_id}, function(err,datapost){
														   var datapost2 = {
															"inventory_id": datapost[0].inventory_id,
															"inventory_name": datapost[0].inventory_name,
															"inventory_type": datapost[0].inventory_type,
															"inventory_version": datapost[0].inventory_version,		// add versioning
															"inventory_path": datapost[0].inventory_path,
															"inventory_package": JSON.parse(Buffer.from(datapost[0].inventory_package, 'base64').toString('ascii')),
															"inventory_create_date": datapost[0].inventory_create_date,
															"project_inventory_id": datapost[0].project_inventory_id
														};
														  datapost2.inventory_update_date = datapost[0].inventory_update_date.slice(0,19).replace('T',' ');
														  if(datapost[0].inventory_update_date!==null){
															datapost2.inventory_update_date = datapost[0].inventory_update_date.slice(0,19).replace('T',' ');
														   }else{
															datapost2.inventory_update_date = "null";
														   }
														   if(datapost[0].project_inventory_id!==null){
															datapost2.project_inventory_id = datapost[0].project_inventory_id;
														   }else{
															datapost2.project_inventory_id = "null";
														   }

														   if(datapost[0].inventory_version == 1){		// add versioning
																datapost2.inventory_version = "true";
															}
															else{
																datapost2.inventory_version = "false";
															}

														  res.json({"err_code": 0, "data" : datapost2});
													   });
													 }
											   });
											
											}else{
												res.json(result3);
											}
										})
									}else{
										res.json({"err_code": 3, "err_msg": "Inventory ID is not found"});
									}									
								}else{
									res.json(result2);
								}
							})
							}else{
								res.json({"err_code": 3, "err_msg": "Inventory ID must be numeric"});
							}
						}else{
							result.err_code = 500;
							res.json(result);
						}
					});
					}else{
		                  res.json({"err_code" : 2, "err_msg": "Project ID must be numeric"});
		                }	
				}else{
					res.json({"err_code": 500,"err_code": "Body is empty"});
				}
				}
			},	
			delete: {
				project: function deleteProject(req, res){
					var ipAddres = req.connection.remoteAddress;
					var apikey = req.params.apikey;
					var project_id = req.params.project_id;
					var ipAddresHeader = req.headers.api;
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }

					checkApikey(apikey, ipAddres, function(result){
						if(result.err_code == 0){
							//proses query ambil data user
							if(typeof project_id !== 'undefined'){
								 userIdApikey = result.data[0].user_id;
									Api_project.findWhereAnd({"project_id": project_id, "project_user_id": userIdApikey},function(err,data){ 
										if(err){
											if(data.errcode==1)
												res.json(data);
											else
												res.json(err);
										}else{
											if(data.length > 0){
												checkProjectId(apikey, project_id, function(result3){
									if(result3.err_code == 0){
										Api_project.delete([{"project_id" : project_id}], function(err,data){
											if(err){
											  if(data.errcode==1)
												res.json(data);
											  else
												res.json(err);
											}else{
												
												Api_inventory.delete({"project_inventory_id" : project_id}, function(err,data){
												});		
											  	res.json({"err_code": 0, "status": "Project has been deleted"})
											}
										  });
										/*Api.delete('project', {"apikey": apikey, "project_id": project_id}, {}, function (error, response, body) {
										  if(error){
										  	res.json(error);
										  }else{
										  	//cek apakah ada error atau tidak
										  	rez = JSON.parse(body);
										  	if(rez.err_code == 0){
											  	res.json({"err_code": 0, "status": "Project is deleted"})
										  	}else{
										  		res.json(body);
										  	}
										  }
										});*/
									}else{
										res.json(result3);
									}
								})
											}else{
												res.json({"err_code": 2, "err_msg": "Access denied. Cannot access this project"});		
											}
										}
									})

							}else{
								res.json({"err_code": 3, "err_msg": "Project ID is not found"});	
							}
						}else{
							result.err_code = 500;
							res.json(result);
						}
					});
				},
				inventory: function deleteInventory(req, res){
					var ipAddres = req.connection.remoteAddress;
					var apikey = req.params.apikey;
					var inventory_id = req.params.inventory_id;
					var project_id = req.params.project_id;
					var ipAddresHeader = req.headers.api;
        
			        //check ip dengan header
			        if (typeof ipAddresHeader !== 'undefined') {
			          ipAddres = ipAddresHeader;          
			        }
					checkApikey(apikey, ipAddres, function(result){
					userIdApikey = result.data[0].user_id;
						if(result.err_code == 0){
							if(typeof project_id !== 'undefined'){
								if(typeof inventory_id !== 'undefined'){
										Api_project.findWhereAnd({"project_id": project_id, "project_user_id": userIdApikey},function(err,data){ 
											//console.log(data);
										if(err){
											if(data.errcode==1)
												res.json(data);
											else
												res.json(err);
										}else{
											if(data.length > 0){
												checkInventoryId(apikey, inventory_id, function(result2){
									if(result2.err_code == 0){
										Api_inventory.delete([{"inventory_id" : inventory_id}], function(err,data){
											if(err){
											  if(data.errcode==1)
												res.json(data);
											  else
												res.json(err);
											}else{
											  res.json({"err_code": 0, "status": "Inventory has been deleted"})
											}
										  });
									}else{
										res.json(result2)
									}
								})
											}else{
												res.json({"err_code": 2, "err_msg": "Access denied. Cannot access this project"});			
										  	}
										}
										})
								}else{
									res.json({"err_code": 2, "err_msg": "InventoryID is not found"});		
								}
							}else{
								res.json({"err_code": 3, "err_msg": "Project ID is not found"});	
							}
							
						}else{
							result.err_code = 500;
							res.json(result);
						}
					});
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

function checkProjectName(apikey, project_name, user_id, callback){
	Api_project.find({}, function(err, data){
	 if(err){
      x(err);
    	}else{
    		//cek jumlah data dulu
			 if(data.length > 0){
		  		var status = false;
		  		var projectOld = [];
		  		for(i=0; i<data.length; i++){
		  			if(data[i].project_name.toString().toLowerCase() == project_name.toString().toLowerCase()){ 				
		  				status = true;
		  				projectOld[0] = {
		  					"project_id": data[i].project_id,
							"project_name": data[i].project_name
		  				}  				
		  			}
		  		}
			if(status){
		  			x({"err_code": 2, "status": "Project already exist", "data" : projectOld});
		  		}else{
		  			x({"err_code": 0, "status": "Project ready to use"});
		  		}
		  	}else{
	  			x({"err_code": 0, "status": "Project ready to use"});
		  	}
		}
	});

	function x(result){
		callback(result)
	}
}

function checkInventoryName(apikey, inventory_name, project_id, callback){
	//method, endpoint, params, options, callback
			Api_inventory.find({}, function(err,data){
				if(err){
				  x(err);
				}else{
				  if(data.length > 0){
							var status = false;
							for(i=0; i<data.length; i++){
								if(data[i].inventory_name.toString().toLowerCase() == inventory_name.toString().toLowerCase()){
									//status = true;
								}
							}					  
		  		if(status){
		  			x({"err_code": 2, "status": "Inventory already exist"});
		  		}else{
		  			x({"err_code": 0, "status": "Inventory ready to use"});
		  		}
		  	}else{
	  			x({"err_code": 0, "status": "Inventory ready to use"});
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

function getProjectId(apikey, callback){
	//method, endpoint, params, options, callback
		Api_project.findLastId('project_id',function(err,data){
    if(err){
      x(err);
    }else{
      if(data.length > 0){
      	console.log("FUNCTION");
      	console.log(data);
        var project_id = parseInt(data[0].project_id) + 1;
	  		x({"err_code": 0, "project_id": project_id});
	  	}else{
	  		x({"err_code": 0, "project_id": 1});
	  	}
    }
  });

	function x(result){
		callback(result)
	}
}

function getInventoryId(apikey, callback){
	//method, endpoint, params, options, callback
		Api_inventory.findLastId('inventory_id',function(err,data){
    if(err){
      x(err);
    }else{
      if(data.length > 0){
        var inventory_id = parseInt(data[0].inventory_id) + 1;
	  		x({"err_code": 0, "inventory_id": inventory_id});
	  	}else{
	  		x({"err_code": 0, "inventory_id": 1});
	  	}
    }
  });

	function x(result){
		callback(result)
	}
}

function getUserByApikey(apikey, callback){
	//method, endpoint, params, options, callback

	Api_user.findWhere({"user_apikey": apikey}, function(err, data){
		console.log(data);
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

//setting tampilan data Project

//New
function checkUserId(apikey, user_id, callback){
	//method, endpoint, params, options, callback
	    Api_user.findById({"user_id" : user_id},function(err,data){
        if(err){
          x(err);
        }else{
          if(data.length>0){
            x({"err_code": 0});
          }else{
            x({"err_code": 3, "err_msg": "User id is not found"});
          }
        }
    });

	function x(result){
		callback(result)
	}
}

function checkProjectId(apikey, project_id, callback){
	//method, endpoint, params, options, callback
		Api_project.findById({"project_id" : project_id},function(err,data){			
        if(err){
          x(err);
        }else{
          if(data.length>0){
            x({"err_code": 0});
          }else{
            x({"err_code": 2, "err_msg": "Project id is not found"});
          }
        }
    });

	function x(result){
		callback(result)
	}
}

function checkGroupId(apikey, group_id, callback){
	//method, endpoint, params, options, callback
	Api_group.findById({"group_id" : group_id},function(err,data){
        if(err){
          x(err);
        }else{
          if(data.length>0){
            x({"err_code": 0});
          }else{
            x({"err_code": 2, "err_msg": "Group id is not found"});
          }
        }
    });

	function x(result){
		callback(result)
	}
}

function checkInventoryId(apikey, inventory_id, callback){
	//method, endpoint, params, options, callback
	Api_inventory.findById({"inventory_id" : inventory_id},function(err,data){
        if(err){
          x(err);
        }else{
          if(data.length>0){
            x({"err_code": 0});
          }else{
            x({"err_code": 2, "err_msg": "Inventory id is not found"});
          }
        }
    });

	function x(result){
		callback(result)
	}
}

function checkProjectShare(apikey, project_id, user_id, callback){

	//Api_project.findWhereAnd({"project_group_id" : group_id, "project_id" : project_id},function(err,data){
	Api_project.findById({"project_id" : project_id}, function(err,data){
        if(err){
          x(err);
        }else{
          if(data.length>0){
			  if(data[0].project_is_share){
				  Api_member.findWhereAnd([{"group_id": data[0].project_group_id },{"user_id" : user_id}], function(err,data){
				  	if(err){
          				x(err);
        			}else{
          				if(data.length>0){
							x({"err_code": 0, "data": data});
						}else{
						x({"err_code": 2, "err_msg": "Project is not share for this user"});
						}
					}
				  });
			  }else{
				x({"err_code": 2, "err_msg": "Project is not share"});
			  }
          }else{
            x({"err_code": 3, "err_msg": "Project ID not found"});
          }
        }
    });

	function x(result){
		callback(result)
	}
}

function checkMemberGroup(apikey, user_id, group_id, callback){

		Api_member.findWhereAnd({"group_id" : group_id, "user_id" : user_id},function(err,data){
        if(err){
          x(err);
        }else{
          if(data.length>0){
            x({"err_code": 0, "data": data});
          }else{
            x({"err_code": 2, "err_msg": "Access denied for this project"});
          }
        }
    });

	function x(result){
		callback(result)
	}
}

function showProjectbyGroup(data,callback){
  var dataGroup = [];
   for(key in data){
      data[key].project_create_date = data[key].project_create_date.slice(0,19).replace('T',' ');
      if(data[key].project_update_date!==null)
        data[key].project_update_date = data[key].project_update_date.slice(0,19).replace('T',' ');
      else
        data[key].project_update_date="null";

      if(data[key].project_is_share==1)
          data[key].project_is_share = "true";
      else
          data[key].project_is_share = "false";

      dataGroup[key] = {
        "project_id" : data[key].project_id,
  	    "project_name" : data[key].project_name,
  	    "project_create_date" : data[key].project_create_date,
        "project_update_date" : data[key].project_update_date,
        "project_is_share" : data[key].project_is_share,
        "group_id" : data[key].project_group_id.toString()
    };
  } callback(dataGroup)
}


//get method
app.get('/:apikey/project/:project_id?/user/:user_id', Project.get.projectByUser);
app.get('/:apikey/project/:project_id?/group/:group_id', Project.get.projectByGroup);
app.get('/:apikey/project/:project_id?/inventory/:inventory_id?', Project.get.inventory);
app.get('/:apikey/download_inventory/:inventory_id?/project/:project_id?', Project.get.download_inventory);
app.get('/:apikey/project_inventory_by_user/:user_id?', Project.get.projectInventoryByUser);
app.get('/:apikey/inventory_by_user/:user_id', Project.get.inventoryByUser);


//post method
app.post('/:apikey/project/user/:user_id', Project.post.project);
app.post('/:apikey/project/:project_id/inventory', Project.post.inventory);


//put method
app.put('/:apikey/project/:project_id/user/:user_id', Project.put.projectByUser);
app.put('/:apikey/project/:project_id/share/:group_id', Project.put.projectShareGroup);
app.put('/:apikey/project/:project_id/inventory/:inventory_id', Project.put.iventoryByInventoryId);

//delete method
app.delete('/:apikey/project/:project_id', Project.delete.project);
app.delete('/:apikey/project/:project_id?/inventory/:inventory_id?', Project.delete.inventory);


var server = app.listen(port, host, function () {
  console.log("Server running at http://%s:%s", host, port);
})
