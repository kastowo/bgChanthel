var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var yamlconfig = require('yaml-config');
var configYaml = yamlconfig.readConfig('../config/config.yml');
var Apiclient = require('apiclient');
var md5 = require('md5');
var mkdirp = require('mkdirp');
var exec = require('child_process').exec;
var Hdfs = require('hdfs');
var host = configYaml.generate_jar.host;
var port = configYaml.generate_jar.port;
var data2xml = require('data2xml');
var convert = data2xml({xmlheader: '<?xml version="1.0" standalone="yes" ?>\n'});

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
var Api_inventory = Database('Inventory');
var Api_cluster = Database('Cluster');
var Api_project = Database('Project');
var Api_compile = Database('Compile');
var Api_member = Database('Member');
var Api_config = Database('Config');
var Api_user = Database('User');


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
var id = /^[0-9]*$/;

var Jar = {
			get: {
				generate_jar: function getGenerateJar(req, res){
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

							if(typeof project_id !== 'undefined'&&id.test(project_id)){
								if(typeof inventory_id !== 'undefined'&&id.test(inventory_id)){
									//proses pembuatan file fisiknya ambil dari inventory
									Api_inventory.findJoin({"inventory_id" : inventory_id}, {Project : "project_inventory_id"}, function(err,data){
									//Api.get('inventory', {"apikey": apikey, "project_id": project_id, "inventory_id": inventory_id}, {}, function (error, response, body) {
									  if(err){
									  	res.json(err);
									  }else{
									  	//var user = JSON.parse(body); //object
									  		//cek jumdata dulu
                      checkProjectShare(project_id,result.data[0].user_id,function(result2){
                        console.log(result2);
                        if(data.length > 0 && result2.err_code==0){
                            //console.log(data);
                            var projectName = data[0].Project.project_name;
  										  		var filename = data[0].inventory_name;
  										  		var filepath = data[0].inventory_path;
  										  		var filetype = data[0].inventory_type;
  										  		var packageEncrypt = data[0].inventory_package;
  									  			var packageDecrypt = new Buffer(packageEncrypt, 'base64').toString('ascii');
                            var packageJson = JSON.parse(packageDecrypt);
                            console.log(packageJson);
                            var packageXml = convert('BG', packageJson);

  									  			packageXml = packageXml.replace('<BG>', '');
  									  			packageXml = packageXml.replace('</BG>', '');
  									  			filepackage = packageXml;

  										  		var project_id = data[0].Project.project_id;
  										  		var inventory_id = data[0].inventory_id;
  													//cek dir path udah ada belum
  										  		if(!fs.existsSync(filepath)){
  										  			mkdirp(filepath, function(err){
  										  				//path exists unless there was an error
  										  				if(err){
  										  					res.json({"err_code": 1, "err_msg": err});
  										  				}else{
  										  					//tulis file ke dir tsb
  										  					fs.writeFile(filepath+filename+'.'+filetype, filepackage,{mode:0o777}, function(err){
  										  						if(err){
  										  							res.json({"err_code": 12, "err_msg": err});
  										  						}else{  										  							
  										  							//compile ke file jar
  										  							exec("DISPLAY=:80 /usr/lib/jvm/java-1.7.0/bin/java -jar HGrid247.jar -flow="+ filepath + filename +'.'+ filetype +' -project='+ projectName +' -projectDir=/tmp', function(error, stdout, stderr){
  										  								console.log(stdout);
  														  				if(stdout.indexOf('succesfuly') > 0){
  														  					//ambil config hdfs
  														  					getUserByApikey(apikey, function(result4){
  																					if(result4.err_code == 0){
  																						//get cluster_config by cluster_id

  																						var cluster_id = result4.user_cluster_id;
  													                  Api_cluster.findJoin({"cluster_id" : cluster_id}, {Config : "config_cluster_id"},function(err,data){
  																						//Api.get('cluster_configs', {"apikey": apikey, "cluster_id": cluster_id}, {}, function(error, response, body){
  																							if(err){
  																						  	res.json({"err_code": 13, "err_msg": err});
  																						  }else{
                                                  console.log(data);
                                                  if(data.length>0){
                                                    if(data[0].cluster_status=="active"||data[0].cluster_status=="default"){
      																						  	//cek apakah ada error atau tidak
      																						  	//var config = JSON.parse(body);
      																						  	var jumdata = data[0].Configs.length;
      																						  	//if(config.err_code == 0){
      																							  	//upload file jar dari config
      																							  	//looping config and check for config hdfs
      																							  	var hostname_hdfs = "";
      																							  	var port_hdfs = "";
      																							  	var username_hdfs = "";

      																							  	for(var i = 0; i < jumdata; i++){
      												                            switch(data[0].Configs[i].config_key){
      												                            	case 'hostnameHdfs':
      		                                                    hostname_hdfs = data[0].Configs[i].config_value;
      												                              break;
      												                              case 'portHdfs':
      		                                                    port_hdfs = data[0].Configs[i].config_value;
      												                              break;
      												                              case 'usernameHdfs':
      		                                                    username_hdfs = data[0].Configs[i].config_value;
      												                              break;
      												                            }
      												                          }

      												                       		//cek config harus lengkap
      												                          if(hostname_hdfs !== "" && port_hdfs !== "" && username_hdfs !== ""){
      												                          	var hdfs = new Hdfs({
      																										  protocol: 'http',
      																										  hostname: hostname_hdfs,
      																										  port: port_hdfs
      																										});
      																										var filepathjar = '/user/'+username_hdfs+'/baciro/jar/'+projectName+'/';

      																					  				//check dir dulu
      																										hdfs.liststatus({
      																										  'user.name': username_hdfs,
      																											path: filepathjar
      																										}, function(error, response, body){
      																											if(error){
      																												res.json({"err_code": 14, "err_msg": error});
      																											}else{
      																												if(body.indexOf('does not exist') > 0){
      																													//buat dirnya
      																													hdfs.mkdirs({
      																														'user.name': username_hdfs,
      																														path: filepathjar
      																													}, function(error, response, body){
      																														if(error){
      																															res.json({"err_code": 15, "err_msg": error});
      																														}else{
      																															hdfs.upload({
      																															  'user.name': username_hdfs,
      																															  overwrite: true,
      																															  localpath: '/tmp/'+ projectName +'.jar',
      																															  path: filepathjar+projectName +'.jar'
      																															}, function(error, response, body) {
      																															  //save to table compile
      																																getCompileId(apikey, function(result3){
      																																	if(result3.err_code == 0){
      																																		//susun body
      																																		var dataCompile = {
      																																											"compile_id": result3.compile_id,
      																																											"compile_name": projectName,
      																																											"compile_path": filepathjar,
      																																											"compile_type": "jar",
      																																											"compile_create_date": getFormattedDate(),
      																																											"compile_project_id": project_id,
      																																											"compile_inventory_id": inventory_id,
      																																										};


      																																		//proses simpan data user
      																																		//method, endpoint, params, options, callback
                                                                          Api_compile.add(dataCompile,function(err,data){
      																																		//Api.post('compile', {"apikey": apikey}, {body: dataCompile, json:true}, function(error, response, body){
      																																			if(err){
      																																		  	res.json({"err_code": 16, "err_msg": err, "application": "Api project", "function": "getGenerateJar"});
      																																		  }else{
      																																		  	//cek apakah ada error atau tidak
      																																		  	// if(body.err_code == 0){
      																																			  	//get compile by id
                                                                                Api_compile.findById({"compile_id": result3.compile_id},function(err,data){
                                                                                //Api.get('compile', {"apikey": apikey, "compile_id": result3.compile_id}, {}, function (errorc, responsec, bodyc) {
      																																					  if(err){
      																																					  	res.json(err);
      																																					  }else{
      																																					  	//var compile = JSON.parse(bodyc); //object
      																																					  	//cek apakah ada error atau tidak
      																																					  	// if(compile.err_code == 0){
      																																						  	//cek jumdata dulu
      																																						  	if(data.length > 0){
                                                                                        data[0].compile_create_date = data[0].compile_create_date.slice(0,19).replace('T',' ');
                                                                                        if(data[0].compile_update_date!==null)
                                                                                          data[0].compile_update_date = data[0].compile_update_date.slice(0,19).replace('T',' ');
                                                                                        else
                                                                                          data[0].compile_update_date="null";
                                                                                        res.json({"err_code": 0, "data":data});
      																																						  	}else{
      																																					  			res.json({"err_code": 17, "err_msg": "Project not found"});
      																																						  	}
      																																					  	// }else{
      																																					  	// 	res.json({"err_code": 18, "err_msg": user.error});
      																																					  	// }
      																																					  }
      																																					});
      																																		  	// }else{
      																																		  	// 	res.json(body);
      																																		  	// }
      																																		  }
      																																		})
      																																	}else{
      																																		result.err_code = 500;
      																																		res.json(result3);
      																																	}
      																																});
      																															});
      																														}
      																													})
      																												}else{
      																													//langsung upload
      																													hdfs.upload({
      																													  'user.name': username_hdfs,
      																													  overwrite: true,
      																													  localpath: '/tmp/'+ projectName +'.jar',
      																													  path: filepathjar+projectName +'.jar'
      																													}, function(error, response, body) {
      																													  //save to table compile
      																														getCompileId(apikey, function(result3){
      																															if(result3.err_code == 0){
      																																//susun body
      																																var dataCompile = {
      																																									"compile_id": result3.compile_id,
      																																									"compile_name": projectName,
      																																									"compile_path": filepathjar,
      																																									"compile_type": "jar",
      																																									"compile_create_date": getFormattedDate(),
      																																									"compile_project_id": project_id,
      																																									"compile_inventory_id": inventory_id,
      																																								};


      																																//proses simpan data user
      																																//method, endpoint, params, options, callback
                                                                      Api_compile.add(dataCompile,function(err,data){
                                                                      //Api.post('compile', {"apikey": apikey}, {body: dataCompile, json:true}, function(error, response, body){
      																																	if(err){
      																																  	res.json({"err_code": 19, "err_msg": err, "application": "Api project", "function": "getGenerateJar"});
      																																  }else{
      																																  	//cek apakah ada error atau tidak
      																																  	// if(body.err_code == 0){
      																																	  	//get compile by id
                                                                            Api_compile.findById({"compile_id": result3.compile_id},function(err,data){
                                                                            //Api.get('compile', {"apikey": apikey, "compile_id": result3.compile_id}, {}, function (errorc, responsec, bodyc) {
      																																			  if(err){
      																																			  	res.json(err);
      																																			  }else{
      																																			  	//var compile = JSON.parse(bodyc); //object
      																																			  	//cek apakah ada error atau tidak
      																																			  	// if(compile.err_code == 0){
      																																				  	//cek jumdata dulu
      																																				  	if(data.length > 0){
                                                                                    data[0].compile_create_date = data[0].compile_create_date.slice(0,19).replace('T',' ');
                                                                                    if(data[0].compile_update_date!==null)
                                                                                      data[0].compile_update_date = data[0].compile_update_date.slice(0,19).replace('T',' ');
                                                                                    else
                                                                                      data[0].compile_update_date="null";
      																																				  		res.json({"err_code": 0, "data":data});
      																																				  	}else{
      																																			  			res.json({"err_code": 20, "err_msg": "Project not found"});
      																																				  	}
      																																			  	// }else{
      																																			  	// 	res.json({"err_code": 21, "err_msg": user.error});
      																																			  	// }
      																																			  }
      																																			});
      																																  	// }else{
      																																  	// 	res.json(body);
      																																  	// }
      																																  }
      																																})
      																															}else{
      																																result.err_code = 500;
      																																res.json(result3);
      																															}
      																														});
      																													});
      																												}
      																											}
      																										})
      												                          }else{
      												                          	res.json({"err_code": 22, "err_msg": "No config in this cluster"});
      												                          }
                                                    }else {
                                                      res.json({"err_code": 22, "err_msg": "Your cluster is not active"});
                                                    }
                                                  }else{
																						  	 	  res.json({"err_code" : 23, "err_msg" : "Cluster id is not found"});
																						  	  }
  																						  }
  																						})
  																					}else{
  																						res.json({"err_code": 23, "err_msg": result4.err_msg})
  																					}
  																				})

  														  				}else{
  														  					if(error){
  														  						console.log(error);
  																					res.json({"err_code": 24, "err_msg": error});
  														  					}else{
  														  						res.json({"err_code": 25, "err_msg": stdout});
  														  					}
  														  				}
  											  						})
  										  						}
  										  					})
  										  				}
  										  			})
  										  		}else{
  										  			//tulis file ke dir tsb
  								  					fs.writeFile(filepath+filename+'.'+filetype, filepackage,{mode:0o777}, function(err){
  								  						if(err){
  								  							res.json({"err_code": 12, "err_msg": err});
  								  						}else{  								  						
  								  							//compile ke file jar
                                  exec("DISPLAY=:80 /usr/lib/jvm/java-1.7.0/bin/java -jar HGrid247.jar -flow="+ filepath + filename +'.'+ filetype +' -project='+ projectName +' -projectDir=/tmp', function(error, stdout, stderr){
                                  //exec("/usr/lib/jvm/java-1.7.0/bin/java -jar HGrid247.jar -flow="+ filepath + filename +'.'+ filetype +' -project='+ projectName +' -projectDir=/tmp', function(error, stdout, stderr){
  								  								console.log(stdout);
  												  				if(stdout.indexOf('succesfuly') > 0){
  												  					//ambil config hdfs
  												  					getUserByApikey(apikey, function(result4){
  																			console.log(result4);
  																			if(result4.err_code == 0){
  																				//get cluster_config by cluster_id

  																				var cluster_id = result4.user_cluster_id;

  																				Api_cluster.findJoin({"cluster_id" : cluster_id}, {Config : "config_cluster_id"},function(err,data){
  																				//Api.get('cluster_configs', {"apikey": apikey, "cluster_id": cluster_id}, {}, function(error, response, body){
  																					console.log(data);
  																					if(err){
  																				  	res.json({"err_code": 13, "err_msg": err});
  																				  }else{
                                              if(data.length>0){
                                                if(data[0].cluster_status=="active"||data[0].cluster_status=="default"){
                                                  //cek apakah ada error atau tidak
      																				  	//var config = JSON.parse(body);
      																				  	var jumdata = data[0].Configs.length;
      																				  	//if(config.err_code == 0){
      																					  	//upload file jar dari config
      																					  	//looping config and check for config hdfs
      																					  	var hostname_hdfs = "";
      																					  	var port_hdfs = "";
      																					  	var username_hdfs = "";

      																					  	for(var i = 0; i < jumdata; i++){
      										                            switch(data[0].Configs[i].config_key){
      										                            	case 'hostnameHdfs':
                                                          hostname_hdfs = data[0].Configs[i].config_value;
      										                              break;
      										                              case 'portHdfs':
                                                          port_hdfs = data[0].Configs[i].config_value;
      										                              break;
      										                              case 'usernameHdfs':
                                                          username_hdfs = data[0].Configs[i].config_value;
      										                              break;
      										                            }
      										                          }

      										                       		//cek config harus lengkap
      										                          if(hostname_hdfs !== "" && port_hdfs !== "" && username_hdfs !== ""){
      										                          	var hdfs = new Hdfs({
      																								  protocol: 'http',
      																								  hostname: hostname_hdfs,
      																								  port: port_hdfs
      																								});
      																								var filepathjar = '/user/'+username_hdfs+'/jar/'+projectName+'/';

      																			  				//check dir dulu
      																								hdfs.liststatus({
      																								  'user.name': username_hdfs,
      																									path: filepathjar
      																								}, function(error, response, body){
      																									if(error){
      																										res.json({"err_code": 14, "err_msg": error});
      																									}else{
      																										if(body.indexOf('does not exist') > 0){
      																											//buat dirnya
      																											hdfs.mkdirs({
      																												'user.name': username_hdfs,
      																												path: filepathjar
      																											}, function(error, response, body){
      																												if(error){
      																													res.json({"err_code": 15, "err_msg": error});
      																												}else{
      																													hdfs.upload({
      																													  'user.name': username_hdfs,
      																													  overwrite: true,
      																													  localpath: '/tmp/'+ projectName +'.jar',
      																													  path: filepathjar+ projectName +'.jar'
      																													}, function(error, response, body) {
      																													  //save to table compile
      																														getCompileId(apikey, function(result3){
      																															console.log(result3);
      																															if(result3.err_code == 0){
      																																//susun body
      																																var dataCompile = {
      																																									"compile_id": result3.compile_id,
      																																									"compile_name": projectName,
      																																									"compile_path": filepathjar,
      																																									"compile_type": "jar",
      																																									"compile_create_date": getFormattedDate(),
      																																									"compile_project_id": project_id,
      																																									"compile_inventory_id": inventory_id,
      																																								};


      																																//proses simpan data user
      																																//method, endpoint, params, options, callback
      																																Api_compile.add(dataCompile,function(err,data){
      																																	console.log(data)
      																																//Api.post('compile', {"apikey": apikey}, {body: dataCompile, json:true}, function(error, response, body){
      																																	if(err){
      																																  	res.json({"err_code": 16, "err_msg": err, "application": "Api project", "function": "getGenerateJar"});
      																																  }else{
      																																  	//cek apakah ada error atau tidak
      																																  	// if(body.err_code == 0){
      																																	  	//get compile by id
      																																			Api_compile.findById({"compile_id": result3.compile_id}, function(err,data){
      																																			//Api.get('compile', {"apikey": apikey, "compile_id": result3.compile_id}, {}, function (errorc, responsec, bodyc) {
      																																			  if(err){
      																																			  	res.json(err);
      																																			  }else{
      																																			  	// var compile = JSON.parse(bodyc); //object
      																																			  	//cek apakah ada error atau tidak
      																																			  	// if(compile.err_code == 0){
      																																				  	//cek jumdata dulu
      																																				  	if(data.length > 0){
                                                                                    data[0].compile_create_date = data[0].compile_create_date.slice(0,19).replace('T',' ');
                                                                                    if(data[0].compile_update_date!==null)
                                                                                      data[0].compile_update_date = data[0].compile_update_date.slice(0,19).replace('T',' ');
                                                                                    else
                                                                                      data[0].compile_update_date="null";
      																																				  		res.json({"err_code": 0, "data": data});
      																																				  	}else{
      																																			  			res.json({"err_code": 17, "err_msg": "Project not found"});
      																																				  	}
      																																			  	// }else{
      																																			  	// 	res.json({"err_code": 18, "err_msg": user.error});
      																																			  	// }
      																																			  }
      																																			});
      																																  	// }else{
      																																  	// 	res.json(body);
      																																  	// }
      																																  }
      																																})
      																															}else{
      																																result.err_code = 500;
      																																res.json(result3);
      																															}
      																														});
      																													});
      																												}
      																											})
      																										}else{
      																											//langsung upload
      																											hdfs.upload({
      																											  'user.name': username_hdfs,
      																											  overwrite: true,
      																											  localpath: '/tmp/'+ projectName +'.jar',
      																											  path: filepathjar+projectName +'.jar'
      																											}, function(error, response, body) {
      																											  //save to table compile
      																												getCompileId(apikey, function(result3){
      																													if(result3.err_code == 0){
      																														//susun body
      																														var dataCompile = {
      																																							"compile_id": result3.compile_id,
      																																							"compile_name": projectName,
      																																							"compile_path": filepathjar,
      																																							"compile_type": "jar",
      																																							"compile_create_date": getFormattedDate(),
      																																							"compile_project_id": project_id,
      																																							"compile_inventory_id": inventory_id,
      																																						};


      																														//proses simpan data user
      																														//method, endpoint, params, options, callback
      																														Api_compile.add(dataCompile,function(err,data){
      																														//Api.post('compile', {"apikey": apikey}, {body: dataCompile, json:true}, function(error, response, body){
      																															if(err){
      																														  	res.json({"err_code": 19, "err_msg": err, "application": "Api project", "function": "getGenerateJar"});
      																														  }else{
      																														  	//cek apakah ada error atau tidak
      																														  	// if(body.err_code == 0){
      																															  	//get compile by id
      																																	Api_compile.findById({"compile_id": result3.compile_id},function(err,data){
      																																	//Api.get('compile', {"apikey": apikey, "compile_id": result3.compile_id}, {}, function (errorc, responsec, bodyc) {
      																																	  if(err){
      																																	  	res.json(err);
      																																	  }else{
      																																	  	//var compile = JSON.parse(bodyc); //object
      																																	  	//cek apakah ada error atau tidak
      																																	  	// if(compile.err_code == 0){
      																																		  	//cek jumdata dulu
      																																		  	if(data.length > 0){
                                                                                data[0].compile_create_date = data[0].compile_create_date.slice(0,19).replace('T',' ');
                                                                                if(data[0].compile_update_date!==null)
                                                                                  data[0].compile_update_date = data[0].compile_update_date.slice(0,19).replace('T',' ');
                                                                                else
                                                                                  data[0].compile_update_date="null";
      																																		  		res.json({"err_code": 0, "data":data});
      																																		  	}else{
      																																	  			res.json({"err_code": 20, "err_msg": "Project not found"});
      																																		  	}
      																																	  	// }else{
      																																	  	// 	res.json({"err_code": 21, "err_msg": user.error});
      																																	  	// }
      																																	  }
      																																	});
      																														  	// }else{
      																														  	// 	res.json(body);
      																														  	// }
      																														  }
      																														})
      																													}else{
      																														result.err_code = 500;
      																														res.json(result3);
      																													}
      																												});
      																								 			});
      																								 		}
      																								 	}
      																								 })
      										                          }else{
      										                          	res.json({"err_code": 22, "err_msg": "No config in cluster"});
      										                          }
                                                  }else {
                                                    res.json({"err_code": 22, "err_msg": "Your cluster is not active"});
                                                  }
  																				  	}else{
  																				  	 	res.json({"err_code" : 23, "err_msg" : "Cluster id is not found"});
  																				  	}
  																				  }
  																				})
  																			}else{
  																				res.json({"err_code": 23, "err_msg": result4.err_msg})
  																			}
  																		})

  												  				}else{
  												  					if(error){
  												  						console.log(error);
  																			res.json({"err_code": 24, "err_msg": error});
  												  					}else{
  												  						res.json({"err_code": 25, "err_msg": stdout});
  												  					}
  												  				}
  									  						})
  								  						}
  								  					})
  										  		}
  									  	}else if(result2.err_code>0){
                          res.json(result2);
                        }else{
                          res.json({"err_code": 26, "err_msg": "Project or inventory is not found"});
                        }
                      });
										}
									});
                }else{
									res.json({"err_code": 28, "err_msg": "Inventory id must be numeric"});
								}
							}else{
								res.json({"err_code": 29, "err_msg": "Project id must be numeric"});
							}
						}else{
							result.err_code = 500;
							res.json(result);
						}
					});
				},
				download: function download(req, res){
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
              var compile_id = req.params.compile_id;
							var project_id = req.params.project_id;
							var userIdApikey = result.data[0].user_id;

              if(typeof project_id !== 'undefined'&&id.test(project_id)){
  							if(typeof compile_id !== 'undefined'&&id.test(compile_id)){
                  //proses pembuatan file fisiknya ambil dari inventory
                  checkProjectShare(project_id,userIdApikey,function(result2){
                    if(result2.err_code==0){
                      Api_compile.findWhereAnd([{"compile_id": compile_id},{"compile_project_id" : project_id}],function(err,dataCompile){
                        //Api.get('compile', {"apikey": apikey, "compile_id": compile_id}, {}, function (error, response, body) {
                        if(err){
      								  	res.json({"err_code":1, "err_msg": err});
      								  }else{
                          if(dataCompile.length>0){
                              getUserByApikey(apikey,function(result3){
                                if(result3.err_code==0){
                                  var cluster_id = result3.user_cluster_id;
                                  Api_cluster.findJoin({"cluster_id":cluster_id},{Config :"config_cluster_id"},function(err,dataCluster){
                                    if(err){
                                      res.json({"err_code": 3, "err_msg": err, "application": "Api generate jar", "function": "download_Jar"});
                                    }else{
                                      var jumdata = dataCluster[0].Configs.length;
                                      if (jumdata > 0) {
                                        if(dataCluster[0].cluster_status == 'active' || dataCluster[0].cluster_status == 'default'){
                                          //looping config and check for config hdfs
                                          var hostname_hdfs = "";
                                          var port_hdfs = "";
                                          var username_hdfs = "";

                                          for(var i = 0; i < jumdata; i++){
                                            switch(dataCluster[0].Configs[i].config_key){
                                              case 'hostnameHdfs':
                                                hostname_hdfs = dataCluster[0].Configs[i].config_value;
                                              break;
                                              case 'portHdfs':
                                                port_hdfs = dataCluster[0].Configs[i].config_value;
                                              break;
                                              case 'usernameHdfs':
                                                username_hdfs = dataCluster[0].Configs[i].config_value;
                                              break;
                                            }
                                          }

                                          //cek config harus lengkap
                                          if(hostname_hdfs !== "" && port_hdfs !== "" && username_hdfs !== ""){
                                            var hdfs = new Hdfs({
                                              protocol: 'http',
                                              hostname: hostname_hdfs,
                                              port: port_hdfs
                                            });
                                            var filepathjar = dataCompile[0].compile_path+dataCompile[0].compile_name+'.'+dataCompile[0].compile_type;

                                            hdfs.download({
                                              'user.name': username_hdfs,
                                              path: filepathjar
                                            }, function(error, response, body) {
                                              res.download(body, dataCompile[0].compile_name+'.'+dataCompile[0].compile_type);
                                            });
                                          }else{
                                            res.json({"err_code": 7, "err_msg": "No config in this cluster"});
                                          }
                                        }else{
                                          res.json({"err_code": 6, "err_msg": "Your cluster is not active"});
                                        }
                                      }else{
                                        res.json({"err_code": 24, "err_msg": "Cluster not found"});
                                      }
                                    }
                                  });
                                }else{
                                  res.json(result3);
                                }
                              });
                          }else{
                            res.json({"err_code":2, "err_msg": "Compile ID is not found"});
                          }
                        }
      							 });
                    }else{
                      res.json(result2);
                    }
                  });
  							}else{
  								res.json({"err_code": 1, "err_msg": "Compile ID must be numeric"});
  							}
              }else{
                res.json({"err_code": 1, "err_msg": "Project ID must be numeric"});
              }
						}else{
							result.err_code = 500;
							res.json(result);
						}
					});
				},
				view_jar: function viewJar(req, res){
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
              var compile_id = req.params.compile_id;
							var project_id = req.params.project_id;
							var userIdApikey = result.data[0].user_id;

              if(typeof project_id !== 'undefined'&&id.test(project_id)){
                if(typeof compile_id !== 'undefined'){
                  if(id.test(compile_id)){
                    Api_compile.findWhereAnd([{"compile_id" : compile_id},{"compile_project_id" :project_id}],function(err,data){
                      if(err){
                        res.json({"err_code":3, "err_msg": err});
                      }else{
                        checkProjectShare(project_id,userIdApikey,function(result2){
                          if(data.length>0&&result2.err_code==0){
                            Api_project.findById({"project_id" : project_id},function(err,dataProject){
                              if(err){
                                res.json(err)
                              }else{
                                if(dataProject.length>0){
                                  var compile_data = {};
                                  data[0].compile_create_date = data[0].compile_create_date.slice(0,19).replace('T',' ');
                                  if(data[0].compile_update_date!==null)
                                    data[0].compile_update_date = data[0].compile_update_date.slice(0,19).replace('T',' ');
                                  else
                                    data[0].compile_update_date="null";
                                  compile_data.project_id = data[0].compile_project_id;
                                  compile_data.project_name = dataProject[0].project_name;
                                  compile_data.compile_id = data[0].compile_id;
                                  compile_data.compile_name = data[0].compile_name;
                                  compile_data.compile_path = data[0].compile_path;
                                  compile_data.compile_type = data[0].compile_type;
                                  compile_data.compile_create_date = data[0].compile_create_date;
                                  compile_data.compile_update_date = data[0].compile_update_date;
                                  compile_data.compile_inventory_id = data[0].compile_inventory_id;
                                  res.json({"err_code":0, "data": compile_data});
                                }
                              }
                            });
                          }else if(result2.err_code>0){
                            res.json(result2);
                          }else{
                            res.json({"err_code":5, "err_msg": "Compile id not found"});
                          }
                        });
                      }
                    });
                  }else{
    								res.json({"err_code": 1, "err_msg": "Compile id must be numeric"});
    							}
                }else{
                  Api_compile.findWhere({"compile_project_id" : project_id},function(err,data){
                    if(err){
                      res.jso(err);
                    }else{
                      checkProjectShare(project_id,userIdApikey,function(result2){
                        if(data.length>0&&result2.err_code==0){
                          Api_project.findById({"project_id" : project_id},function(err,dataProject){
                            if(err){
                              res.json(err);
                            }else{
                              if(dataProject.length>0){
                                var compile_data = [];
                                for(key in data){
                                  compile_data[key] = {};
                                  data[key].compile_create_date = data[key].compile_create_date.slice(0,19).replace('T',' ');
                                  if(data[key].compile_update_date!==null)
                                    data[key].compile_update_date = data[key].compile_update_date.slice(0,19).replace('T',' ');
                                  else
                                    data[key].compile_update_date="null";
                                  compile_data[key].project_id = data[key].compile_project_id;
                                  compile_data[key].project_name = dataProject[0].project_name;
                                  compile_data[key].compile_id = data[key].compile_id;
                                  compile_data[key].compile_name = data[key].compile_name;
                                  compile_data[key].compile_path = data[key].compile_path;
                                  compile_data[key].compile_type = data[key].compile_type;
                                  compile_data[key].compile_create_date = data[key].compile_create_date;
                                  compile_data[key].compile_update_date = data[key].compile_update_date
                                }res.json({"err_code":0, "data": compile_data});
                              }
                            }
                          });
                        }else if(result2.err_code>0){
                          res.json(result2);
                        }else{
                          res.json({"err_code": 1, "err_msg": "No compile for this project"});
                        }
                      });
                    }
                  });
                }
              }else{
                res.json({"err_code": 1, "err_msg": "project_id id must be numeric"});
              }
						}else{
							result.err_code = 500;
							res.json(result);
						}
					});
				}
			}
}

function checkProjectShare(project_id,user_id,callback){
  Api_project.findById({"project_id" : project_id},function(err,data){
    if(err){
      x(err);
    }else{
      if(data.length>0){
        if(data[0].project_is_share){
            Api_member.findWhereAnd([{"group_id" : data[0].project_group_id},{"user_id" : user_id}],function(err,data){
              if(err){
                x(err);
              }else{
                if(data.length>0){
                  x({"err_code" : 0, "status" : "Access allowed"})
                }else{
                  Api_project.findWhereAnd([{"project_id" : project_id},{"project_user_id" : user_id}],function(err,data){
                    if(err){
                      x(err);
                    }else{
                      if(data.length>0){
                        x({"err_code" : 0, "status" : "Access allowed"})
                      }else{
                        x({"err_code" : 3, "err_msg" : "Access denied for this project"})
                      }
                    }
                  });
                }
              }
            });
        }else{
          Api_project.findWhereAnd([{"project_id" : project_id},{"project_user_id" : user_id}],function(err,data){
            if(err){
              x(err);
            }else{
              if(data.length>0){
                x({"err_code" : 0, "status" : "Access allowed"})
              }else{
                x({"err_code" : 2, "err_msg" : "Project is not share"})
              }
            }
          });
        }
      }else{
        x({"err_code" : 1, "err_msg" : "Project id is not found"})
      }
    }
  });
  function x(result){
		callback(result)
	}
}

function checkApikey(apikey, ipAddres, callback){
	//method, endpoint, params, options, callback
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
	/*Api.get('check_apikey', {"apikey": apikey}, {}, function (error, response, body) {
	  if(error){
	  	x(error);
	  }else{
	  	user = JSON.parse(body);
	  	//cek apakah ada error atau tidak
	  	if(user.err_code == 0){
		  	//cek jumdata dulu
		  	if(user.data.length > 0){
		  		//check user_id == 1 <-- admin/root
		  		if(user.data[0].user_id == 1){
		  			x({"err_code": 0, "status": "root", "user_role_id": user.data[0].user_role_id, "user_id": user.data[0].user_id});
		  		}else{
			  		//cek apikey
				  	if(apikey == user.data[0].user_apikey){
				  		//ipaddress
					  	dataIpAddress = user.data[0].user_ip_address;
					  	if(dataIpAddress.indexOf(ipAddres) >= 0){
					  		//user is active
					  		if(user.data[0].user_is_active){
					  			//cek data user terpenuhi
					  			x({"err_code": 0, "status": "active"});
					  		}else{
					  			x({"err_code": 5, "err_msg": "User not active", "application": "user_management"});
					  		}
					  	}else{
					  		x({"err_code": 4, "err_msg": "Ip Address not registered", "application": "user_management"});
					  	}
				  	}else{
				  		x({"err_code": 3, "err_msg": "Wrong apikey", "application": "user_management"});
				  	}
		  		}

		  	}else{
		  			x({"err_code": 2, "err_msg": "Wrong apikey", "application": "user_management"});
		  	}
	  	}else{
	  		x({"err_code": 1, "err_msg": user.error, "application": "user_management"});
	  	}
	  }
	});*/

	function x(result){
		callback(result)
	}
}

function getFormattedDate() {
  var date = new Date();
  var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

  return str;
}

function getCompileId(apikey, callback){
	Api_compile.findLastId('compile_id',function(err,data){
		if(err){
			x(err);
		}else{
			if(data.length>0){
				var compile_id = parseInt(data[0].compile_id) + 1;
				x({"err_code": 0, "compile_id": compile_id});
			}else{
				x({"err_code": 0, "compile_id": 1});
			}
		}
	});
	//method, endpoint, params, options, callback
	/*Api.get('get_compile_id', {"apikey": apikey}, {}, function (error, response, body) {
	  if(error){
	  	x(error);
	  }else{
	  	compile = JSON.parse(body);
	  	//cek apakah ada error atau tidak
	  	if(compile.err_code == 0){
		  	//cek jumdata dulu
		  	if(compile.data.length > 0){
		  		var compile_id = parseInt(compile.data[0].compile_id) + 1;
		  		x({"err_code": 0, "compile_id": compile_id});
		  	}else{
		  		x({"err_code": 0, "compile_id": 1});
		  	}
	  	}else{
	  		x({"err_code": 1, "err_msg": project.error, "application": "Api generate jar", "function": "getCompileId"});
	  	}
	  }
	});*/

	function x(result){
		callback(result)
	}
}

function getUserByApikey(apikey, callback){
	//method, endpoint, params, options, callback
	Api_user.findWhere({"user_apikey" : apikey}, function(err,data){
		if(err){
			x(err);
		}else{
			if(data.length>0){
				var user_firstname = data[0].user_firstname;
				var user_lastname = data[0].user_lastname;
				var user_cluster_id = data[0].user_cluster_id;
				if(user_cluster_id==null){
					Api_cluster.findWhere({"cluster_status" : "default"},function(err,data){
            if(err){
              x({"err_code" : 500, "err_msg" : err});
            }else{
              if(data.length>0){
                x({"err_code": 0, "user_firstname": user_firstname, "user_lastname": user_lastname, "user_cluster_id": data[0].cluster_id});
              }else{
                x({"err_code" : 3, "err_msg" : "default_config is not found"});
              }
            }
          });
        }else
          x({"err_code": 0, "user_firstname": user_firstname, "user_lastname": user_lastname, "user_cluster_id": user_cluster_id});
			}else{
				x({"err_code": 2, "err_msg": "Apikey failed", "application": "Api project", "function": "getUserByApikey"});
			}
		}
	});
	/*Api.get('get_user_by_apikey', {"apikey": apikey}, {}, function (error, response, body) {
	  if(error){
	  	x(error);
	  }else{
	  	user = JSON.parse(body);
	  	//cek apakah ada error atau tidak
	  	if(user.err_code == 0){
		  	//cek jumdata dulu
		  	if(user.data.length > 0){
		  		var user_firstname = user.data[0].user_firstname;
		  		var user_lastname = user.data[0].user_lastname;
		  		var user_cluster_id = user.data[0].user_cluster_id;
		  		x({"err_code": 0, "user_firstname": user_firstname, "user_lastname": user_lastname, "user_cluster_id": user_cluster_id});
		  	}else{
		  		x({"err_code": 2, "err_msg": "Apikey failed", "application": "Api project", "function": "getUserByApikey"});
		  	}
	  	}else{
	  		x({"err_code": 1, "err_msg": inventory.error, "application": "Api project", "function": "getUserByApikey"});
	  	}
	  }
	});*/

	function x(result){
		callback(result)
	}
}



//get method
app.get('/:apikey/generate_jar/:project_id?/:inventory_id?', Jar.get.generate_jar);
app.get('/:apikey/download_jar/:compile_id?/project/:project_id?/', Jar.get.download);
app.get('/:apikey/view_jar/:compile_id?/project/:project_id?', Jar.get.view_jar);
//post method
// app.post('/:apikey/project/user/:user_id', Project.post.project);



//put method
// app.put('/:apikey/project/:project_id/user/:user_id', Project.put.projectByUser);


//delete method
// app.delete('/:apikey/project/:project_id', Project.delete.project);

/*var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)

})*/

var server = app.listen(port, host, function () {
  console.log("Server running at http://%s:%s", host, port);
})
