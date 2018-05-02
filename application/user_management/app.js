var express = require('express');
var app = express();
var fs = require("fs");
var bodyParser = require('body-parser');
var yamlconfig = require('yaml-config');
var configYaml = yamlconfig.readConfig('../config/config.yml');
var Apiclient = require('apiclient');
var md5 = require('md5');
var path = require("path");

var host = configYaml.user_management.host;
var port = configYaml.user_management.port;

//orm
var Database = require("../mysql/Mysql.js");
var Api_privilege = Database('Privilege');
var Api_inventory = Database('Inventory');
var Api_cluster = Database('Cluster');
var Api_project = Database('Project');
var Api_member = Database('Member');
var Api_group = Database('Group');
var Api_role = Database('Role');
var Api_user = Database('User');

//setting midleware
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
var ip = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
var valid = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

var User = {
			get: function getUser(req, res){				
        var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
        var ipAddresHeader = req.headers.api;

        //check ip dengan header
        if (typeof ipAddresHeader !== 'undefined') {
          ipAddres = ipAddresHeader;  
          console.log("with Header");
          console.log(ipAddres);
        }            
        console.log("without Header");
        console.log(ipAddres);   
        checkApikey(apikey, ipAddres, function(result){    
        console.log(ipAddres);                
	       if(result.err_code==0){
              var user_id = req.params.user_id;
              if(typeof user_id !== 'undefined'){
                if(id.test(user_id)){
                  //check akses get user, hanya boleh admin dan dirinya sendiri
                  if(user_id==result.data[0].user_id||result.status=="root"){
                    //query mencari user berdasarkan id
                    Api_user.findById({"user_id": user_id}, function(err,data){
                      if(err){
                        res.json(err);
                      }else{
                        //show data
                        if(data.length>0){
                          //menampilkan data user
                          showUser(data,function(dataUser){
                            res.json({"err_code" : 0, "data" : dataUser});
                          });
                        }else{
                          res.json({"err_code" : 2, "err_msg": "User ID is not found"});
                        }
                      }
                  });
                  }else{
                    res.json({"err_code": 5, "err_msg": "Access denied to view user"});
                  }
                }else{
                  res.json({"err_code" : 2, "err_msg": "User ID must be numeric"});
                }
              }else{
                //check akses get all user, hanya boleh admin
                if(result.status=="root"){
                  //query untuk menampilkan semua list user
                  Api_user.find({}, function(err,data){
                    if(err){
                      if(data.errcode==1)
                        res.json(data);
                      else
                        res.json(err);
                    }else{
                      	//cek jumdata dulu
    								  	if(data.length > 0){
                          //menampilkan data user
                          showUser(data,function(dataUser){
                              res.json({"err_code": 0, "data":dataUser});
    								  	  });
                        }else{
    							  			res.json({"err_code": 4, "err_msg": "User data is empty", "application": "Api User Management", "function": "getUser"});
    								  	}
                    }
                  });
                }else{
                  res.json({"err_code": 5, "err_msg": "Access denied to view users"});
                }
              }
          }else{
						result.err_code = 500;
						res.json(result);
					}
				});      
			},
			post: function addUser(req, res){
				var ipAddres = req.connection.remoteAddress;
        var apikey = req.params.apikey;
				var user_email = req.body.user_email;
        var user_role_id = req.body.user_role_id;
        var ipAddresHeader = req.headers.api;
        
        //check ip dengan header
        if (typeof ipAddresHeader !== 'undefined') {
          ipAddres = ipAddresHeader;          
        } 
        checkApikey(apikey, ipAddres, function(result){
          //check akses tambah user, hanya boleh admin
          if(result.status == "root"){
						if(typeof req.body.user_firstname !== 'undefined'&& req.body.user_firstname!==""){
              //cek email data user apakah sudah ada atau belum dan valid atau tidak
              checkEmail(apikey, user_email, function(result2){
  							if(result2.err_code == 0){
                   if(typeof req.body.user_password !== 'undefined' && req.body.user_password!==""){
                      if(typeof req.body.user_ip_address !== 'undefined' && ip.test(req.body.user_ip_address)){
                        if (typeof req.body.user_role_id !== 'undefined' && req.body.user_role_id !== "") {      
                          if (id.test(req.body.user_role_id)) {                             
                            //ambil id user terakhir
                            getUserId(apikey, function(result3){
            									if(result3.err_code == 0){
            										//susun body
            										if(typeof req.body.user_lastname == 'undefined')
                                    req.body.user_lastname = "";
                                  var dataUser = {
              																			"user_id": result3.user_id,
              																			"user_firstname": req.body.user_firstname.replace(/ /g,""),
              																			"user_lastname": req.body.user_lastname.replace(/ /g,""),
              																			"user_email": req.body.user_email,
              																			"user_apikey": generateApikey(getFormattedDate()),
              																			"user_create_date": getFormattedDate(),
              																			"user_password": md5(req.body.user_password),
              																			"user_is_active": true,
              																			"user_ip_address": req.body.user_ip_address,
                                                    "user_role_id": req.body.user_role_id
              																		};
              										//proses tambah data user ke database
                                  console.log(dataUser);
                                  Api_user.add(dataUser,function(err,data){
                                    //cek apakah ada error atau tidak
                                    if(err){
              										  	res.json({"err_code": 1, "err_msg": err, "application": "Api User Management", "function": "addUser"});
              										  }else{
              										  	if(data.errcode == 0){
                                        //ambil data user yang sudah di tambahkan
                                        Api_user.findById({"user_id": result3.user_id}, function(err,datapost){
                                          showUser(datapost,function(dataUser){
                                            res.json({"err_code": 0, "data" : dataUser});
                  								  	    });
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
                              res.json({"err_code" : 2, "err_msg": "Role ID must be numeric"});
                             }
                          }else{
                            res.json({"err_code" : 2, "status" : "Role ID is required"});
                          }
                        }else{
                          res.json({"err_code" : 2, "status" : "IP address is invalid"});
                        }
                    }else{
                      res.json({"err_code" : 2, "status" : "Password is invalid"});
                    }
  							}else{
  								result.err_code = 500;
  								res.json(result2);
  							}
  						})
             }else{
                res.json({"err_code" : 2, "status" : "First name is required"});
             }
					}else{
						res.json({"err_code": 3, "err_msg": "Access denied"});
					}
				});
			},
			put: function updateUser(req, res){
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
						if(typeof user_id !== 'undefined'&&id.test(user_id)){
							checkUser(user_id,function(result2){
                //check akses update, hanya boleh admin dan dirinya sendiri
                if(result2.err_code==0&&(result.data[0].user_id==result2.data[0].user_id||result.status=="root")){
                  //cek untuk data yang akan diupdate
                  var dataUser= {};
                  var params = true;
                  if(typeof req.body.user_firstname !== 'undefined'&&req.body.user_firstname!==""){
    								dataUser.user_firstname = req.body.user_firstname.replace(/ /g,"");
    							}else if(req.body.user_firstname =="")
                    params=false;

    							if(typeof req.body.user_lastname !== 'undefined'&&req.body.user_lastname!==""){
    								dataUser.user_lastname = req.body.user_lastname.replace(/ /g,"");
    							}else if(req.body.user_lastname =="")
                    params=false;

                  var status_email=true;
    							if(typeof req.body.user_email !== 'undefined'&&req.body.user_email!==""){
                    if(valid.test(req.body.user_email))
                      dataUser.user_email = req.body.user_email;
                    else
                      status_email=false;
    							}else if(req.body.user_email =="")
                    params=false;

    							if(typeof req.body.user_password !== 'undefined'&&req.body.user_password!==""){
    								dataUser.user_password = md5(req.body.user_password);
    							}else if(req.body.user_password =="")
                    params=false;

    							if(typeof req.body.user_is_active !== 'undefined'&&req.body.user_is_active!==""){
    								dataUser.user_is_active = req.body.user_is_active;
    							}else if(req.body.user_is_active =="")
                    params=false;

                  var status_ip=true;
                  if(typeof req.body.user_ip_address !== 'undefined'&&req.body.user_ip_address!==""){
                    var ip_body = req.body.user_ip_address.split(",");
                    var ip_insert = "";
                    for(key in ip_body){
                      if(ip.test(ip_body[key])){
                        if(result2.data[0].user_ip_address.indexOf(ip_body[key])>=0)
                          continue;
                        else
                            ip_insert+=","+ip_body[key];
                      }else{
                        status_ip=false;
                      }
                    }
                    if(ip_insert!=="")
                      dataUser.user_ip_address = ""+result2.data[0].user_ip_address+ip_insert;
    							}else if(req.body.user_ip_address =="")
                    params=false;

                  if(typeof req.body.user_role_id !== 'undefined'&&req.body.user_role_id !==""){
    								dataUser.user_role_id = req.body.user_role_id;
   							  }else if(req.body.user_role_id =="")
                    params=false;

                  if(typeof req.body.user_cluster_id !== 'undefined'&&req.body.user_cluster_id !==""){
    								dataUser.user_cluster_id = req.body.user_cluster_id;
   							  }else if(req.body.user_cluster_id =="")
                    params=false;

                  dataUser.user_update_date = getFormattedDate();
    							if(params){
                    if(status_email){
                     if(status_ip){
                       checkRoleId(dataUser,function(result3){
                        if(result3.err_code==0){
                          checkClusterId(dataUser,function(result4){
                           if(result4.err_code==0){
                             Api_user.update({"user_id" : user_id},dataUser,function(err,data){
                                 if(err){
                                   if(data.errcode==1)
                                      res.json(data);
                                    else
                                      res.json(err);
                                 }else{
                                   Api_user.findById({"user_id": user_id}, function(err,dataUpdate){
                                      showUser(dataUpdate,function(dataUser){
                                        res.json({"err_code": 0, "data" : dataUser});
              								  	    });
                                   });
                                 }
                             });
                           }else{
                             res.json(result4)
                           }
                         });
                        }else{
                          res.json(result3)
                        }
                      });
                     }else{
                       res.json({"err_code" : 2, "status" : "IP address is invalid"});
                     }
                   }else{
                     res.json({"err_code" : 2, "status" : "Email is invalid"});
                   }
                 }else{
                   res.json({"err_code" : 3, "status" : "Parameters cannot Empty"});
                 }
               }else if(result2.err_code==1){
                 res.json({"err_code": 2, "err_msg": "User ID is not found"});
               }else{
                  res.json({"err_code": 3, "err_msg": "Access denied"});
                }
              });
            }else{
							res.json({"err_code": 2, "err_msg": "User iD must be numeric"});
						}
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
        }else{
          res.json({"err_code": 500, "err_msg": "Body cannot Empty"});
        }
			},
			delete: function deleteUser(req, res){
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
						if(typeof user_id !== 'undefined'&&id.test(user_id)){
              checkUser(user_id,function(result2){
                //check akses delete, hanya boleh admin
                if(result2.err_code==0&&result.status=="root"){
                  //hapus user
                  Api_user.delete([{"user_id" : user_id}], function(err1,dataUser){
                    if(err1){
                      if(dataUser.errcode==1)
                        res.json({"err_code": 2, "err_msg": "User ID is not found"});
                      else
                        res.json(err1);
                    }else{
                      //delete project and inventory yang tidak di share oleh user
                      Api_project.findWhereAnd([{"project_user_id" : user_id},{"project_is_share" : false}],function(err,data){
                        if(data.length>0){
                          Api_project.delete([{"project_user_id" : user_id},{"project_is_share" : false}],function(err,data){                            
                          });
                          for(key in data){
                            Api_inventory.delete([{"project_inventory_id" : data[key].project_id}],function(err,data){                              
                            });
                          }
                        }
                      });
                      //cek termasuk dalam member atau tidak
                      checkUserAsMember([{"user_id" : user_id}],function(result2){
                        if(result2.err_code==0){
                          //termasuk dalam member
                          var count=0;
                          for(key in result2.data){
                            //console.log(count);
                            //console.log(result2.data.length);
                            //check tiap keanggotaan dari user id yang di hapus dalam group
                            Api_group.findJoin({"group_id" : result2.data[key].group_id},{Member : "group_id"},function(err,dataGroup){
                              //hapus member
                              Api_member.delete([{"group_id" : dataGroup[0].group_id},{"user_id" : user_id}], function(err,data){});
                              var dataMember = dataGroup[0].Members;
                              //check kuota group
                              if(dataMember.length>1){
                                //check member as admin's group
                                if(dataGroup[0].group_user_id==user_id){
                                  console.log("user is admin's group");
                                  //change admin's group to member with member_id below him/his
                                  console.log("update admin's group");
                                  var updateAdmin = {"group_user_id" : dataMember[1].user_id, "group_update_date" : getFormattedDate()};
                                  Api_group.update({"group_id" : dataGroup[0].group_id},updateAdmin,function(err,data){});
                                  var updateMember = {"member_role" : "Administrator", "member_update_date" :getFormattedDate()};
                                  Api_member.update({"member_id" : dataMember[1].member_id},updateMember,function(err,data){});

                                  //check project for user
                                  Api_project.findWhereAnd([{"project_user_id" : user_id},{"project_group_id" : dataGroup[0].group_id}],function(err,dataProject){
                                    if(dataProject.length>0){
                                      console.log("check user's project");
                                      for(key in dataProject){
                                        //check project_is_share
                                        //if project_is_share, change the owner to new admin's group(ga jadi). if not, delete project and inventory
                                        if(dataProject[key].project_is_share){
                                          //project di biarkan
                                          console.log("check user's project is share");
                                          // var updateProject = {"project_user_id" : dataMember[1].user_id};
                                          // Api_project.update({"project_id" : dataProject[key].project_id},updateProject,function(err,data){});
                                          if(count==result2.data.length-1)
                                            res.json({"err_code": 0, "status": "User has been deleted"})
                                          if(key==dataProject.length-1)
                                            count++;
                                        }else{
                                          // console.log("check user's project is not share, delete project and inventory");
                                          // Api_project.delete([{"project_id" : dataProject[key].project_id}],function(err,data){});
                                          // Api_inventory.delete([{"project_inventory_id" : dataProject[key].project_id}],function(err,data){});
                                          if(count==result2.data.length-1)
                                            res.json({"err_code": 0, "status": "User has been deleted"})
                                          if(key==dataProject.length-1)
                                            count++;
                                        }
                                      }
                                    }else{
                                      if(count==result2.data.length-1)
                                        res.json({"err_code": 0, "status": "User has been deleted"})
                                      else
                                        count++;
                                    }
                                  });
                                }else{
                                  console.log("user is only just a member group");
                                  Api_project.findWhereAnd([{"project_user_id" : user_id},{"project_group_id" : dataGroup[0].group_id}],function(err,dataProject){
                                    if(dataProject.length>0){
                                      console.log("check user's project");
                                      console.log(dataProject.length);
                                      for(key in dataProject){
                                        //check project_is_share
                                        //if project_is_share, change the owner to new admin's group(ga jadi). if not, delete project and inventory
                                        if(dataProject[key].project_is_share){
                                          //project dibiarkan
                                          console.log("user's project is share");
                                          // var updateProject = {"project_user_id" : dataMember[0].user_id};
                                          // Api_project.update({"project_id" : dataProject[key].project_id},updateProject,function(err,data){});
                                          if(count==result2.data.length-1)
                                            res.json({"err_code": 0, "status": "User has been deleted"});
                                          if(key==dataProject.length-1)
                                            count++;
                                        }else{
                                          // console.log("user's project is not share, delete project and inventory");
                                          // Api_project.delete([{"project_id" : dataProject[key].project_id}],function(err,data){});
                                          // Api_inventory.delete([{"project_inventory_id" : dataProject[key].project_id}],function(err,data){});
                                          if(count==result2.data.length-1)
                                            res.json({"err_code": 0, "status": "User has been deleted"});
                                          if(key==dataProject.length-1)
                                            count++;
                                        }
                                      }
                                    }else{
                                      if(count==result2.data.length-1)
                                        res.json({"err_code": 0, "status": "User has been deleted"});
                                      else
                                        count++;
                                    }
                                  });
                                }
                              }else{
                                //if member there is only just admin's group in group, delete group and all project yang dimiliki admin
                                console.log("delete group, because there is only admin in group");
                                Api_group.delete([{"group_id" : dataGroup[0].group_id}],function(err,data){});
                                Api_project.findWhereAnd([{"project_user_id" : user_id},{"project_group_id" : dataGroup[0].group_id}],function(err,dataProject){
                                  if(dataProject.length>0){
                                    Api_project.delete([{"project_user_id" : user_id},{"project_group_id" : dataGroup[0].group_id}],function(err,data){
                                      //ubah status project dalam group yang bukan milik user
                                      var updateProject = {
                                        "project_group_id" : null,
                                        "project_is_share" : false,
                                        "project_update_date" : getFormattedDate()
                                      };
                                      Api_project.update({"project_group_id" : dataGroup[0].group_id},updateProject,function(err,data){});
                                    });
                                    for(key in dataProject){
                                      if(count==result2.data.length-1)
                                        res.json({"err_code": 0, "status": "User has been deleted"});
                                      if(key==dataProject.length-1){
                                        count++;
                                      }else{
                                        Api_inventory.delete([{"project_inventory_id" : dataProject[key].project_id}],function(err,data){});
                                      }
                                    }
                                  }else{
                                    if(count==result2.data.length-1)
                                      res.json({"err_code": 0, "status": "User has been deleted"});
                                    else
                                      count++;
                                  }
                                });
                              }
                            });
                          }
                        }else{
                          //tidak termasuk dalam member
                          // Api_project.findWhere({"project_user_id" : user_id},function(err,dataProject){
                          //   if(dataProject.length>0){
                          //     //hapus semua project dan inventory yang dimiliki user
                          //     Api_project.delete([{"project_user_id" : user_id}],function(err,data){});
                          //     for(key in dataProject){
                          //       if(key==dataProject.length-1){
                          //         res.json({"err_code": 0, "status": "User has been deleted"})
                          //       }else{
                          //         Api_inventory.delete([{"project_inventory_id" : dataProject[key].project_id}],function(err,data){});
                          //       }
                          //     }
                          //   }else{
                               res.json({"err_code": 0, "status": "User has been deleted"})
                          //   }
                          // });
                        }
                      });
                    }
                  });
                }else if(result2.err_code==1){
                  res.json({"err_code": 2, "err_msg": "User ID is not found"});
                }else{
                  res.json({"err_code": 3, "err_msg": "Access denied. Cannot delete this user"});
                }
              });
            }else{
							res.json({"err_code": 1, "err_msg": "User ID must be numeric"});
						}
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
			}
}

var Group = {
			get:{
        group : function getGroup(req, res){
  				var ipAddres = req.connection.remoteAddress;
  				var apikey = req.params.apikey;
          var ipAddresHeader = req.headers.api;
        
        //check ip dengan header
        if (typeof ipAddresHeader !== 'undefined') {
          ipAddres = ipAddresHeader;          
        }
  				checkApikey(apikey, ipAddres, function(result){
            console.log(result);
					if(result.err_code == 0){
						//proses query ambil data group
						var group_id = req.params.group_id;
						if(typeof group_id !== 'undefined'){
              if(id.test(group_id)){
  							Api_group.findById({"group_id": group_id}, function(err,data){
                    if(err){
                       res.json(err);
                    }else{
                      //show data
                      if(data.length>0){
                        //convert date
                        showGroup(data,function(dataGroup){
                          res.json({"err_code" : 0, "data" : dataGroup});
                        });
                      }else{
                        res.json({"err_code" : 2, "err_msg": "Group ID is not found"});
                      }
                    }
                });
              }else{
                res.json({"err_code" : 2, "err_msg": "Group iD must be numeric"});
              }
            }else{
							Api_group.find({}, function(err,data){
                if(err){
                  if(data.errcode==1)
                    res.json(data);
                  else
                    res.json(err);
                }else{
               	  //cek jumdata dulu
  							  if(data.length > 0){
                    showGroup(data,function(dataGroup){
                      res.json({"err_code" : 0, "data" : dataGroup});
                    });
  							  }else{
  						  		res.json({"err_code": 4, "err_msg": "Group data is empty", "application": "Api User Management", "function": "getGroup"});
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
        groupByuser : function getGroupByUser(req,res){
          var ipAddres = req.connection.remoteAddress;
  				var apikey = req.params.apikey;
          var user_id = req.params.user_id;
          var ipAddresHeader = req.headers.api;
        
        //check ip dengan header
        if (typeof ipAddresHeader !== 'undefined') {
          ipAddres = ipAddresHeader;          
        }

          checkApikey(apikey,ipAddres,function(result){
            if(result.err_code==0){
                var group_id = req.params.group_id;
                if(typeof group_id !== 'undefined'){
                  if(id.test(group_id)){
                    if(typeof group_id !== 'undefined'&&id.test(user_id)){
                      checkUser(user_id,function(result2){
                        if(result2.err_code==0){
                          Api_group.findWhereAnd([{"group_id": group_id},{"group_user_id":user_id}], function(err,data){
                              if(err){
                                 res.json(err);
                              }else{
                                //show data
                                if(data.length>0){
                                  //convert date
                                  showGroup(data,function(dataGroup){
                                    res.json({"err_code" : 0, "data" : dataGroup});
                                  });
                                }else{
                                  res.json({"err_code" : 2, "err_msg": "Group is not found"});
                                }
                              }
                          });
                        }else{
                          res.json(result2);
                        }
                      });
                    }else{
                      res.json({"err_code" : 2, "err_msg": "User ID must be numeric"});
                    }
                  }else{
                    res.json({"err_code" : 2, "err_msg": "Group ID must be numeric"});
                  }
                }else{
                  checkUser(user_id,function(result2){
                    if(result2.err_code==0){
                      Api_group.findWhere([{"group_user_id":user_id}], function(err,data){
                          if(err){
                             res.json(err);
                          }else{
                            //show data
                            if(data.length>0){
                              //convert date
                              showGroup(data,function(dataGroup){
                                res.json({"err_code" : 0, "data" : dataGroup});
                              });
                            }else{
                              res.json({"err_code" : 2, "err_msg": "Group is not found"});
                            }
                          }
                      });
                    }else{
                      res.json(result2);
                    }
                  });
                }
            }else {
              result.err_code = 500;
  						res.json(result);
            }
          });
        }
      },
			post: function addGroup(req, res){
				var ipAddres = req.connection.remoteAddress;
				var apikey = req.params.apikey;
				var group_name = req.body.group_name;
        var ipAddresHeader = req.headers.api;
        
        //check ip dengan header
        if (typeof ipAddresHeader !== 'undefined') {
          ipAddres = ipAddresHeader;          
        }    

				checkApikey(apikey, ipAddres, function(result){                  
					if(result.err_code == 0){
			      if(typeof req.body.group_name !== 'undefined'&& req.body.group_name!==""){
              //cek group name
  						checkGroupName(apikey, group_name, function(result2){
  							if(result2.err_code == 0){
                  var group_stat = {};
                  var idg_status;
  								if(typeof req.body.group_status !=='undefined'&&req.body.group_status!==""){
                    //ambil id group terakhir
                    if (req.body.group_status=='true')
                      idg_status = 1;
                    else
                      idg_status = 0;
                    group_stat.group_status = idg_status;
                    console.log("OK GANS ...");
                    console.log(group_stat.group_status);
                    getGroupId(apikey, function(result3){
    									if(result3.err_code == 0){
    										//susun body
                        //jadikan member group yang dibuat
                        getMemberId(apikey,function(result4){
                          var dataMember = {
                                            "member_id": result4.member_id,
                                            "user_id": result.data[0].user_id,
                                            "group_id": result3.group_id,
                                            "member_create_date": getFormattedDate(),
                                            "member_status" : "Active",
                                            "member_status_request" : "Confrim",
                                            "member_role" : "Administrator"
                                          };
                          Api_member.add(dataMember,function(err,data){});
                        });
    										var dataGroup = {
    																			"group_id": result3.group_id,
    																			"group_name": req.body.group_name,
    																			"group_status": group_stat.group_status,
    																			"group_is_active": true,
                                          "group_user_id" : result.data[0].user_id,
    																			"group_create_date": getFormattedDate()
    																		};

    										//proses simpan data group
    										Api_group.add(dataGroup,function(err,data){
    											if(err){
    										  	res.json({"err_code": 1, "err_msg": err, "application": "Api User Management", "function": "addGroup"});
    										  }else{
    										  	//cek apakah ada error atau tidak
    										  	if(data.errcode == 0){
    											  	Api_group.findById({"group_id": result3.group_id}, function(err,datapost){
                                  showGroup(datapost,function(dataGroup){
                                    res.json({"err_code" : 0, "data" : dataGroup});
                                  });
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
                    res.json({"err_code" : 2, "status" : "Group status is required"});
                  }
  							}else{
  								result.err_code = 500;
  								res.json(result2);
  							}
  						})
            }else{
              res.json({"err_code" : 2, "status" : "Group name is required"});
            }
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
			},
			put: function updateGroup(req, res){
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
						var group_id = req.params.group_id;
						if(typeof group_id !== 'undefined'&&id.test(group_id)){
              checkGroup(group_id,function(result2){
                if(result2.err_code==0&&(result.data[0].user_id==result2.data[0].group_user_id||result.status=="root")){
    							//cek untuk data yang akan diupdate
    							var dataGroup= {};
                  var params = true;                  
                  var idg_status;
    							if(typeof req.body.group_name !== 'undefined'&& req.body.group_name!==""){
    								dataGroup.group_name = req.body.group_name;
                  }else if(req.body.group_name =="")
                    params=false;

    							if(typeof req.body.group_is_active !== 'undefined'&&req.body.group_is_active!==""){
    								dataGroup.group_is_active = req.body.group_is_active;
    							}else if(req.body.group_is_active =="")
                    params= false;
   						
                  if(typeof req.body.group_status !== 'undefined' && req.body.group_status !== ""){
                    if (req.body.group_status=='true')
                      idg_status = 1;
                    else
                      idg_status = 0;
                    dataGroup.group_status = idg_status;
                  }else if(req.body.group_status =="")
                    params=false;

    							dataGroup.group_update_date = getFormattedDate();
                  if(params){
                    checkGroupName(apikey,dataGroup.group_name,function(result3){
                      if(result3.err_code==0){
                        Api_group.update({"group_id" : group_id},dataGroup,function(err,data){
                         if(err){
                           if(data.errcode==1)
                              res.json(data);
                            else
                              res.json(err);
                         }else{
                           Api_group.findById({"group_id": group_id}, function(err,dataUpdate){
                              showGroup(dataUpdate,function(dataGroup){
                                res.json({"err_code" : 0, "data" : dataGroup});
                                console.log(dataGroup);
                              });
                           });
                         }
                       });
                     }else{                      
                       res.json({"err_code": 2, "status": "Group is already exist"});
                     }
                    });
                  }else{
                    res.json({"err_code": 3, "status": "Parameters cannot Empty"});
                  }
    						}else if(result2.err_code==1){
                  res.json(result2);
                }else{
                  res.json({"err_code": 3, "err_msg": "Access denied. Cannot update Group"});
                }
              });
            }else{
							res.json({"err_code": 3, "err_msg": "Group ID must be numeric"});
						}
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
        }else{
          res.json({"err_code": 500, "err_msg": "Body cannot Empty"});
        }
			},
			delete: function deleteGroup(req, res){
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
						var group_id = req.params.group_id;
						if(typeof group_id !== 'undefined'&&id.test(group_id)){
              checkGroup(group_id,function(result2){
                if(result2.err_code==0&&(result.data[0].user_id==result2.data[0].group_user_id||result.status=="root")){
    							Api_group.delete([{"group_id" : group_id}], function(err,data){
                    if(err){
                      if(data.errcode==1)
                        res.json(data);
                      else
                        res.json(err);
                    }else{
                      var updateProject = {
                        "project_group_id" : null,
                        "project_is_share" : false,
                        "project_update_date" : getFormattedDate()
                      };//update project yang dimiliki, group menjadi not share dan menghilangkan kepemilikan project oleh group
                      Api_project.update({"project_group_id" : group_id},updateProject,function(err,data){});
                      Api_member.delete([{"group_id" : group_id}], function(err,data){
                        if(err){
                          if(data.errcode==1)
                            res.json({"err_code": 0, "status": "Group has been deleted"});
                          else
                            res.json(err);
                        }else{
                          res.json({"err_code": 0, "status": "Group has been deleted"});
                        }
                      });
                    }
                  });
                }else if (result2.err_code==1) {
                  res.json(result2);
                }else {
                  res.json({"err_code": 3, "err_msg": "Access denied. Cannot delete this Group"});
                }
              });
						}else{
							res.json({"err_code": 3, "err_msg": "Group ID must be numeric"});
						}
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
			}
}

var Member = {
			get: function getMember(req, res){
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
						var group_id = req.params.group_id;
						if(typeof group_id !== 'undefined'){
              if(id.test(group_id)){
                //check for the existing group
  							checkGroup(group_id,function(result2){
                   if(result2.err_code==0){
                      Api_group.findJoin({"group_id": group_id},{Member : "group_id"}, function(err,dataM){
                          if(err){
                            res.json(err);
                          }else{
                          	console.log(dataM);
                            console.log("SINI DLU GAN !!");                                                  
                            //show data
                            if(dataM[0].Members.length>0){
                              var member_group = [];
                              var count = 0;
                              for(key in dataM[0].Members){
                                member_group[key] = {
                                    "member_id" : dataM[0].Members[key].member_id,
                                    "group_name" : dataM[0].group_name
                                };

                                Api_user.findById({"user_id" : dataM[0].Members[key].user_id.toString()},function(err,dataU){
                                    if(err){
                                        res.json(err);
                                    }else{
                                    	console.log(dataU);
                                        if(dataU.length>0){
                                            if(dataU[0].user_lastname==null)
                                              dataU[0].user_lastname="null"
                                            member_group[count].user_id = dataU[0].user_id;
                                            member_group[count].user_firstname = dataU[0].user_firstname;
                                            member_group[count].user_lastname = dataU[0].user_lastname;
                                            member_group[count].user_email = dataU[0].user_email;

                                            if(dataM[0].Members[count].member_status==null)
                                              dataM[0].Members[count].member_status="null";
                                            if(dataM[0].Members[count].member_status_request==null)
                                              dataM[0].Members[count].member_status_request="null";
                                            member_group[count].member_status = dataM[0].Members[count].member_status;
                                            member_group[count].member_status_request = dataM[0].Members[count].member_status_request;
                                            member_group[count].member_role = dataM[0].Members[count].member_role;

                                            if(count==dataM[0].Members.length-1)
                                              res.json({"err_code" : 0, "data" : member_group});
                                            else
                                              count++;
                                        }else{
                                            res.json({"err_code" : 1, "err_msg" : "User is doesn't Exist"});
                                        }
                                    }
                                });
                                console.log('abac');
                                console.log(member_group);
                              }
                            }else{
                              res.json({"err_code": 2, "err_msg": "No member in this group"});
                            }
                          }
                      });
                  }else{
                    res.json({"err_code": 3, "err_msg": "Group ID is not found"});
                  }
                });
              }else{
                  res.json({"err_code": 3, "err_msg": "Group ID must be numeric"});
              }
            }else{
							res.json({"err_code": 3, "err_msg": "Group ID is not found"});
						}
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
			},
			post: function addMember(req, res){
				var ipAddres = req.connection.remoteAddress;
				var apikey = req.params.apikey;
				var group_id = req.body.group_id;
				var user_id = req.body.user_id;
				var member_create_by = req.body.create_by;
        var ipAddresHeader = req.headers.api;
        
        //check ip dengan header
        if (typeof ipAddresHeader !== 'undefined') {
          ipAddres = ipAddresHeader;          
        }

				checkApikey(apikey, ipAddres, function(result){                
					if(result.err_code == 0){
             //cek group ada atau tidak
             if(id.test(group_id)){
               checkGroup(group_id,function(result2){
                 if(result2.err_code==0&&result.data[0].user_id==result2.data[0].group_user_id || result.status == "root"){
                    if(id.test(user_id)){
                    //cek user ada atau tidak
                      checkUser(user_id,function(result4){
                      	//res.json(result4);
                        if(result4.err_code==0){
                          //cek apakah sudah menjadi member dari group tersebut
                          checkUserAsMember([{"user_id" : user_id},{"group_id" : group_id}], function(result5){
                            if(result5.err_code==1){
                              //ambil id member terakhir
                							getMemberId(apikey, function(result3){
                								if(result3.err_code == 0){
                									//susun body
                									var dataMember = {
                																		"member_id": result3.member_id,
                																		"user_id": user_id,
                																		"group_id": group_id,
                																		"member_create_date": getFormattedDate(),
                																		"member_status" : "Active",
                                                    "member_status_request" : "Confirm",
                                                    "member_role" : "Member"
                																	};

                									//method, endpoint, params, options, callback
                									Api_member.add(dataMember,function(err,data){
                											if(err){
                										  	res.json({"err_code": 1, "err_msg": err, "application": "Api User Management", "function": "addMember"});
                										  }else{
                										  	//cek apakah ada error atau tidak
                										  	if(data.errcode == 0){
                                          var data_Member = {
                                            "member_id": result3.member_id,
                                            "group_id" : group_id,
                                            "user_id" : user_id
                                          };
                                          showMember(data_Member,function(result4){
                                            res.json({"err_code": 0, "data" : result4});
                                          });
                                        }else{
                										  		res.json(data);
                										  	}
                										  }
                										});
                                }else{
                									result3.err_code = 500;
                									res.json(result3);
                								}
                							});
                            }else{
       									      res.json({"err_code": 1, "status": "User is already member in this group"});
                            }
                          });
                        }else{
                            result4.err_code = 500;
                            res.json(result4);
                        }
                      });
                    }else {
                      res.json({"err_code": 3, "err_msg": "User ID must be numeric"});
                    }
                 }else if(result2.err_code==1){
                     res.json(result2);
                 }else {
                   res.json({"err_code": 3, "err_msg": "Access denied"});
                 }
               });
             }else {
               res.json({"err_code": 3, "err_msg": "Group ID must be numeric"});
             }
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
			},
			put: function updateMember(req, res){
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
						var member_id = req.params.member_id;
						var group_id = req.body.group_id;
						var user_id = req.body.user_id;
						var member_status = req.body.member_status;
            var member_role = req.body.member_role;
            var member_status_request = req.body.member_status_request;
            if(id.test(member_id)){
              checkMember(member_id,function(result2){
                if(result2.err_code==0){
      						if(typeof group_id !== 'undefined'&&id.test(group_id)){
                    checkGroup(group_id,function(result3){
                      if(result3.err_code==0&&result.data[0].user_id==result3.data[0].group_user_id){
          							if(typeof user_id !== 'undefined'&&id.test(user_id)){
                           checkUser(user_id,function(result4){
                             if(result4.err_code==0){
                               checkUserAsMember([{"user_id" : user_id},{"group_id" : group_id}], function(result5){
                                 if(result5.err_code==1){
                                    //cek untuk data yang akan diupdate
                    								var dataMember= {};

                    								dataMember.user_id = user_id;
                    								dataMember.group_id = group_id;
                                    var params = true;
                      							if(typeof req.body.member_status !== 'undefined'&& req.body.member_status!=="")
                                      dataMember.member_status = member_status;
                                    else if(req.body.member_status=="")
                                      params=false;
                                    if(typeof req.body.member_status_request !== 'undefined'&& req.body.member_status_request!=="")
                                      dataMember.member_status_request = member_status_request;
                                    else if(req.body.member_status_request=="")
                                      params=false;
                                    if(typeof req.body.member_role !== 'undefined'&& req.body.member_role!=="")
                                      dataMember.member_role = member_role;
                                    else if(req.body.member_role=="")
                                      params=false;


                                    if(params){
                                      dataMember.member_update_date = getFormattedDate();
                      								Api_member.update({"member_id" : member_id},dataMember,function(err,data){
                                         if(err){
                                           if(data.errcode==1)
                                              res.json(data);
                                            else
                                              res.json(err);
                                         }else{
                                           var data_Member = {
                                             "member_id": member_id,
                                             "group_id" : group_id,
                                             "user_id" : user_id
                                           };
                                           showMember(data_Member,function(result4){
                                             res.json({"err_code": 0, "data" : result4});
                                           });
                                        }
                                     });
                                    }else{
                                      res.json({"err_code": 3, "status": "Parameters cannot Empty"});
                                    }
                                 }else {
                                   res.json({"err_code": 2, "err_msg": "Member is already exist"});
                                 }
                               });
                             }else{
                               res.json(result4);
                             }
                           });
          							}else{
          								res.json({"err_code": 3, "err_msg": "User ID is required and must be numeric"});
          							}
      						    }else if(result3.err_code==1){
                        res.json(result3);
                      }else{
                        res.json({"err_code": 3, "err_msg": "Access denied"});
                      }
                    });
                  }else{
      							res.json({"err_code": 3, "err_msg": "Group ID is required and must be numeric"});
      						}
                }else{
                  res.json({"err_code": 3, "err_msg": "Member ID is not found"});
                }
              });
            }else {
              res.json({"err_code": 3, "err_msg": "Member ID must be numeric"});
            }
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
        }else{
          res.json({"err_code": 500, "err_msg": "Body cannot Empty"});
        }
			},
			delete: function deleteMember(req, res){
				var ipAddres = req.connection.remoteAddress;
				var apikey = req.params.apikey;
        var group_id = req.params.group_id;
        var ipAddresHeader = req.headers.api;
        
        //check ip dengan header
        if (typeof ipAddresHeader !== 'undefined') {
          ipAddres = ipAddresHeader;          
        }

				checkApikey(apikey, ipAddres, function(result){
					if(result.err_code == 0){
            if(typeof group_id !== 'undefined'&&id.test(group_id)){
              checkGroup(group_id,function(result2){
                if(result2.err_code==0&&result.data[0].user_id==result2.data[0].group_user_id){
                  //proses query ambil data user
      						var member_id = req.params.member_id;
                  if(typeof member_id !== 'undefined'&&id.test(member_id)){
                    Api_member.findWhere({"group_id" : group_id},function(err,dataMember){
                      Api_member.delete([{"member_id" : member_id}], function(err,data){
                        if(err){
                          if(data.errcode==1)
                            res.json({"err_code": 1, "err_msg": "Member ID is not found"});
                          else
                            res.json(err);
                        }else{
                          if(dataMember.length>1){
                            //check member as admin's group
                            if(dataMember[0].user_id==result2.data[0].group_user_id){
                              //change admin's group
                              console.log("change admin")
                              var updateGroup = {"group_user_id" : dataMember[1].user_id, "group_update_date" : getFormattedDate()};
                              Api_group.update({"group_id" : group_id},updateGroup,function(err,data){});
                              var updateMember = {"member_role" : "Administrator", "member_update_date" : getFormattedDate()};
                              Api_member.update({"member_id" : dataMember[1].member_id},updateMember,function(err,data){});
                              res.json({"err_code": 0, "status": "Member has been deleted"})
                            }else{
                              console.log("admin not change")
                              res.json({"err_code": 0, "status": "Member has been deleted"})
                            }
                          }else{
                            //member hanya satu sebelum member di hapus
                            var updateProject = {
                              "project_group_id" : null,
                              "project_is_share" : false,
                              "project_update_date" : getFormattedDate()
                            };//update project yang dimiliki, group menjadi not share dan menghilangkan kepemilikan project oleh group
                            Api_project.update({"project_group_id" : group_id},updateProject,function(err,data){});
                            //delete group karena sudah tidak ada member
                            Api_group.delete([{"group_id" : group_id}],function(err,data){
                              res.json({"err_code": 0, "status": "Member and Group has been deleted"});
                            });
                          }
                        }
                      });
                    });
        					}else {
                    res.json({"err_code": 3, "err_msg": "Member ID must be numeric"});
                  }
                }else if(result2.err_code==1){
                  res.json(result2)
                }else {
                  res.json({"err_code": 3, "err_msg": "Access denied. Cannot delete this Member"});
                }
              });
            }else{
              res.json({"err_code": 3, "err_msg": "Group ID must be numeric"});
            }
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
			}
}

var Role = {
			get: function getRole(req, res){
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
						var role_id = req.params.role_id;
						if(typeof role_id !== 'undefined'){
              if(id.test(role_id)){
                //Api_role.findJoin({"role_id": role_id},{Privilege :"privilege_role_id"}, function(err,data)
                Api_role.findById({"role_id": role_id}, function(err,data){
                    if(err){
                       res.json(err);
                    }else{
                      //show data
                      if(data.length>0){
                        data[0].role_create_date = data[0].role_create_date.slice(0,19).replace('T',' ');
                        if(data[0].role_update_date!==null)
                          data[0].role_update_date = data[0].role_update_date.slice(0,19).replace('T',' ');
                        else
                          data[0].role_update_date="null"
                        res.json({"err_code" :0, "data" : data});
                        /*showRole(data,function(dataRole){
                          res.json(dataRole);
                        });*/
                      }else{
                        res.json({"err_code" : 2, "err_msg": "Role id is not found"});
                      }
                    }
                });
              }else {
                res.json({"err_code": 3, "err_msg": "Role ID must be numeric"});
              }
						}else{
							Api_role.findById({}, function(err,data){
                if(err){
                  if(data.errcode==1)
                    res.json(data);
                  else
                    res.json(err);
                }else{
               	  //cek jumdata dulu
								  if(data.length > 0){
                    //take necessary data
                    for(key in data){
                      data[key].role_create_date = data[key].role_create_date.slice(0,19).replace('T',' ');
                      if(data[key].role_update_date!==null)
                        data[key].role_update_date = data[key].role_update_date.slice(0,19).replace('T',' ');
                      else
                        data[key].role_update_date="null"
                    }res.json({"err_code" :0, "data" : data});
                    /*showRole(data,function(dataRole){
                      res.json(dataRole);
                    });*/
                  }else{
							  		res.json({"err_code": 4, "err_msg": "Role data is empty", "application": "Api User Management", "function": "getRole"});
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
			post: function addRole(req, res){
				var ipAddres = req.connection.remoteAddress;
				var apikey = req.params.apikey;
				var role_name = req.body.role_name;
        var ipAddresHeader = req.headers.api;
        
        //check ip dengan header
        if (typeof ipAddresHeader !== 'undefined') {
          ipAddres = ipAddresHeader;          
        }

				checkApikey(apikey, ipAddres, function(result){
					if(result.err_code == 0){
             if(typeof req.body.role_name !== 'undefined'&& req.body.role_name!==""){
    						//cek role name sudah ada atau tidak
    						checkRoleName(apikey, role_name, function(result2){
    							if(result2.err_code == 0){
    								//ambil id user terakhir
    								getRoleId(apikey, function(result3){
    									if(result3.err_code == 0){
    										//susun body
    										var dataRole = {
    																			"role_id": result3.role_id,
    																			"role_name": role_name,
    																			"role_create_date": getFormattedDate()
    																		};

    										//proses simpan data user
    										Api_role.add(dataRole,function(err,data){
    											if(err){
    										  	res.json({"err_code": 1, "err_msg": err, "application": "Api User Management", "function": "addRole"});
    										  }else{
    										  	//cek apakah ada error atau tidak
    										  	if(data.errcode == 0){
          									  	Api_role.findById({"role_id": result3.role_id}, function(err,datapost){
                                  datapost[0].role_create_date = datapost[0].role_create_date.slice(0,19).replace('T',' ');
                                  if(datapost[0].role_update_date!==null)
                                    datapost[0].role_update_date = datapost[0].role_update_date.slice(0,19).replace('T',' ');
                                  else
                                    datapost[0].role_update_date = "null";
                                  res.json({"err_code": 0, "data" : datapost});
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
            }else{
              res.json({"err_code" : 2, "status" : "Role name is required"});
            }
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
			},
			put: function updateRole(req, res){
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
						var role_id = req.params.role_id;
						if(typeof role_id !== 'undefined'&&id.test(role_id)){
							//cek untuk data yang akan diupdate
							var dataRole= {};
							if(typeof req.body.role_name !== 'undefined' && req.body.role_name!==""){
								dataRole.role_name = req.body.role_name;

                dataRole.role_update_date = getFormattedDate();
                Api_role.update({"role_id" : role_id},dataRole,function(err,data){
                   if(err){
                     if(data.errcode==1)
                        res.json({"err_code" : 2, "err_msg": "Role id is not found"});
                      else
                        res.json(err);
                   }else{
                     Api_role.findById({"role_id": role_id}, function(err,dataUpdate){
                        dataUpdate[0].role_create_date = dataUpdate[0].role_create_date.slice(0,19).replace('T',' ');
                        if(dataUpdate[0].role_update_date!==null)
                          dataUpdate[0].role_update_date = dataUpdate[0].role_update_date.slice(0,19).replace('T',' ');
                        else
                          dataUpdate[0].role_update_date = "null";
                        res.json({"err_code": 0, "data" : dataUpdate});
                     });
                   }
                 });
              }else{
								res.json({"err_code": 2, "err_msg": "Role name is empty"});
							}
						}else{
							res.json({"err_code": 3, "err_msg": "Role ID must be numeric"});
						}
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
        }else{
          res.json({"err_code": 500, "err_msg": "Body cannot Empty"});
        }
			},
			delete: function deleteRole(req, res){
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
						var role_id = req.params.role_id;
						if(typeof role_id !== 'undefined'&&id.test(role_id)){
							Api_role.delete([{"role_id" : role_id}], function(err,data){
                if(err){
                  if(data.errcode==1)
                    res.json({"err_code": 1, "err_msg": "Role ID is not found"});
                  else
                    res.json(err);
                }else{
                  res.json({"err_code": 0, "status": "Role has been deleted"})
                }
              });
            }else{
							res.json({"err_code": 3, "err_msg": "Role ID must be numeric"});
						}
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
			}
}
//skip dulu
var Privilege = {
			post: function addPrivilege(req, res){
				var ipAddres = req.connection.remoteAddress;
				var apikey = req.params.apikey;
				var role_id = req.params.role_id;
				var privilege_menu = req.body.privilege_menu;
        var ipAddresHeader = req.headers.api;
        
        //check ip dengan header
        if (typeof ipAddresHeader !== 'undefined') {
          ipAddres = ipAddresHeader;          
        }

				checkApikey(apikey, ipAddres, function(result){
					if(result.err_code == 0){
						//cek email data user apakah sudah ada atau belum
						checkPrivilegeMenu(apikey, privilege_menu, function(result2){
							if(result2.err_code == 0){
								//ambil id user terakhir
								getPrivilageId(apikey, function(result3){
									if(result3.err_code == 0){
										if(privilege_menu == '*'){
					            var privilege_view = true;
					            var privilege_create = true;
					            var privilege_update = true;
					            var privilege_delete = true;
					          }else{
					            var privilege_view = req.body.privilege_view;
					            var privilege_create = req.body.privilege_create;
					            var privilege_update = req.body.privilege_update;
					            var privilege_delete = req.body.privilege_delete;
					          }

										//susun body
										var dataPrivilege = {
																			"privilege_id": result3.privilege_id,
																			"privilege_menu": privilege_menu,
																			"privilege_view": privilege_view,
																			"privilege_create": privilege_create,
																			"privilege_update": privilege_update,
																			"privilege_delete": privilege_delete,
																			"privilege_create_date": getFormattedDate(),
																		  "privilege_role_id" : role_id
                                    };

										//proses simpan data user
										Api_privilege.add(dataPrivilege,function(err,data){
											if(err){
										  	res.json({"err_code": 1, "err_msg": err, "application": "Api User Management", "function": "addPrivilege"});
										  }else{
										  	//cek apakah ada error atau tidak
										  	if(data.errcode == 0){
											  	res.json({"err_code": 0, "status": "Privilege have been create"});
										  	}else{
										  		res.json(data);
										  	}
										  }
										});
										//method, endpoint, params, options, callback
                    /*Api.post('privilege', {"apikey": apikey, "role_id": role_id}, {body: dataPrivilege, json:true}, function(error, response, body){
											if(error){
										  	res.json({"err_code": 1, "err_msg": error, "application": "Api User Management", "function": "addPrivilege"});
										  }else{
										  	//cek apakah ada error atau tidak
										  	if(body.err_code == 0){
											  	res.json({"err_code": 0, "status": "Privilege add is succes "})
										  	}else{
										  		res.json(body);
										  	}
										  }
										})*/
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
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
			},
			put: function updatePrivilege(req, res){
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
						var privilege_id = req.params.privilege_id;
						if(typeof privilege_id !== 'undefined'){
							//cek untuk data yang akan diupdate
							var dataPrivilege= {};
							var privilege_menu = req.body.privilege_menu;
							if(typeof privilege_menu !== 'undefined'){
								if(privilege_menu == '*'){
			            var privilege_view = true;
			            var privilege_create = true;
			            var privilege_update = true;
			            var privilege_delete = true;
			          }else{
			          	var privilege_view = req.body.privilege_view;
			            var privilege_create = req.body.privilege_create;
			            var privilege_update = req.body.privilege_update;
			            var privilege_delete = req.body.privilege_delete;
			          }

			          //susun body
								var dataPrivilege = {
																	"privilege_menu": privilege_menu,
																	"privilege_view": privilege_view,
																	"privilege_create": privilege_create,
																	"privilege_update": privilege_update,
																	"privilege_delete": privilege_delete,
																	"privilege_update_date": getFormattedDate()
																};
							}else{
								res.json({"err_code": 2, "err_msg": "Privilege menu is empty"});
							}
              Api_privilege.update({"privilege_id" : privilege_id},dataPrivilege,function(err,data){
                 if(err){
                   if(data.errcode==1)
                      res.json(data);
                    else
                      res.json(err);
                 }else{
                   res.json(data);
                 }
               });
							/*Api.put('privilege', {"apikey": apikey, "privilege_id": privilege_id}, {body: dataPrivilege, json:true}, function (error, response, body) {
							  if(error){
							  	res.json(error)
							  }else{
							  	if(body.err_code == 0){
								  	res.json({"err_code": 0, "status": "Privilege have been update"});
							  	}else{
							  		res.json({"err_code": 1, "err_msg": user.error, "application": "Api User Management", "function": "updatePrivilege"});
							  	}
							  }
							});*/
						}else{
							res.json({"err_code": 3, "err_msg": "Privilege id not found"});
						}
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
			},
			delete: function deleteRole(req, res){
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
						var role_id = req.params.role_id;
						if(typeof role_id !== 'undefined'){
							Api.delete('role', {"apikey": apikey, "role_id": role_id}, {}, function (error, response, body) {
							  if(error){
							  	res.json(error);
							  }else{
							  	//cek apakah ada error atau tidak
							  	rez = JSON.parse(body);
							  	if(rez.err_code == 0){
								  	res.json({"err_code": 0, "status": "Role is deleted"})
							  	}else{
							  		res.json(body);
							  	}
							  }
							});
						}else{
							res.json({"err_code": 3, "err_msg": "Role id not found"});
						}
					}else{
						result.err_code = 500;
						res.json(result);
					}
				});
			}
}

var Login = {
  post: function userLogin(req, res){
    var ipAddres = req.connection.remoteAddress;
    var apikey = req.params.apikey;
    var user_email = req.body.user_email;
    var user_password = md5(req.body.user_password);
    var ipAddresHeader = req.headers.api;
        
        //check ip dengan header
        if (typeof ipAddresHeader !== 'undefined') {
          ipAddres = ipAddresHeader;          
        }

    checkApikey(apikey, ipAddres, function(result){
      console.log("satu");
      if(result.err_code == 0){        
        //proses simpan data user
        Api_user.findWhereAnd([{"user_email": req.body.user_email},{"user_password": md5(req.body.user_password)}],function(err,data){
          console.log(data);                    
          if(err){
            res.json(err);
          }else{
            if(data.length > 0){   
            //console.log("di sini dlu");           
        if(data[0].user_is_active){ 
          var roleID = [];
            roleID = {
                      "user_id" : data[0].user_id,
                      "user_firstname" : data[0].user_firstname,
                      "user_lastname" : data[0].user_lastname,
                      "user_email" : data[0].user_email,
                      "user_apikey" : data[0].user_apikey,
                      "user_ip_address" : data[0].user_ip_address,
                      "user_create_date" : data[0].user_create_date,
                      "user_update_date" : data[0].user_update_date,
                      "user_is_active" : data[0].user_is_active,
                      "user_cluster_id" : data[0].user_cluster_id,                       
                      "user_role_id" : data[0].user_role_id
                      };
              if(roleID.user_is_active == 1)
                roleID.user_is_active ="true";

              roleID.user_create_date = roleID.user_create_date.slice(0,19).replace('T',' ');

              if(roleID.user_update_date!==null)
              roleID.user_update_date = roleID.user_update_date.slice(0,19).replace('T',' ');  

             if(roleID.user_update_date == null)
              roleID.user_update_date = "null";


            if(roleID.user_cluster_id == null)
              roleID.user_cluster_id = "null";

            if(roleID.user_role_id == null)
              roleID.user_role_id = "null";

              res.json({"err_code": 0, "data":roleID}); 

                }else{
                res.json({"err_code": 3, "err_msg": "User is not active"});
              }
              }else{
                res.json({"err_code": 2, "err_msg": "User data is not found"});
              }
          }
        });
      }else{
        result.err_code = 500;
        res.json(result);
      }
    });
  }
}
//get role saat join dengan Privilege
function showRole(data,callback){
  var JOIN = {"errcode" : 0, "data" : []};
  var count =0;
  for(key in data){
    if(typeof data[key].Privileges[0]!=='undefined'){
      for(key1 in data[key].Privileges){
        JOIN.data[count] = {
                      "role_id": data[key].role_id,
	                    "role_name": data[key].role_name,
	                    "role_create_date": data[key].role_create_date,
	                    "role_update_date": data[key].role_update_date,
        };
        //convert date
        JOIN.data[count].role_create_date = JOIN.data[count].role_create_date.slice(0,19).replace('T',' ');
        if(JOIN.data[count].role_update_date!==null)
          JOIN.data[count].role_update_date = JOIN.data[count].role_update_date.slice(0,19).replace('T',' ');

        JOIN.data[count].privilege_menu = data[key].Privileges[key1].privilege_menu;
        JOIN.data[count].privilege_view= data[key].Privileges[key1].privilege_view;
        JOIN.data[count].privilege_create= data[key].Privileges[key1].privilege_create;
        JOIN.data[count].privilege_update= data[key].Privileges[key1].privilege_update;
        JOIN.data[count].privilege_delete= data[key].Privileges[key1].privilege_delete;
        count++;
      }
    }else{
      JOIN.data[count] = {
                      "role_id": data[key].role_id,
	                    "role_name": data[key].role_name,
	                    "role_create_date": data[key].role_create_date,
	                    "role_update_date": data[key].role_update_date,
      };
      //convert date
      JOIN.data[count].role_create_date = JOIN.data[count].role_create_date.slice(0,19).replace('T',' ');
      if(JOIN.data[count].role_update_date!==null)
        JOIN.data[count].role_update_date = JOIN.data[count].role_update_date.slice(0,19).replace('T',' ');

      JOIN.data[count].privilege_menu = "null";
      JOIN.data[count].privilege_view= "null";
      JOIN.data[count].privilege_create= "null";
      JOIN.data[count].privilege_update= "null";
      JOIN.data[count].privilege_delete= "null";
      count++;
    }
  }
  callback(JOIN)
}
//setting tampilan data user
function showUser(data,callback){
  var dataUser = [];
   for(key in data){
      data[key].user_create_date = data[key].user_create_date.slice(0,19).replace('T',' ');
      if(data[key].user_update_date!==null)
        data[key].user_update_date = data[key].user_update_date.slice(0,19).replace('T',' ');
      else
        data[key].user_update_date="null";

      if(data[key].user_is_active)
          data[key].user_is_active = "true";
      else
          data[key].user_is_active = "false";

      if(data[key].user_lastname==null)
        data[key].user_lastname="null";
      if(data[key].user_cluster_id==null)
        data[key].user_cluster_id="null";
       if(data[key].user_role_id==null)
        data[key].user_role_id="null";

      dataUser[key] = {
        "user_id" : data[key].user_id,
  	    "user_firstname" : data[key].user_firstname,
  	    "user_lastname" : data[key].user_lastname,
        "user_email" : data[key].user_email,
  	    "user_apikey" : data[key].user_apikey,
  	    "user_ip_address" : data[key].user_ip_address,
  	    "user_create_date" : data[key].user_create_date,
  	    "user_update_date" : data[key].user_update_date,
  	    "user_is_active" : data[key].user_is_active,
        "user_cluster_id" : data[key].user_cluster_id,
        "user_role_id" : data[key].user_role_id
    };
  } callback(dataUser)
}
//setting tampilan data group
function showGroup(data,callback){
  var dataGroup = [];
   for(key in data){
      data[key].group_create_date = data[key].group_create_date.slice(0,19).replace('T',' ');
      if(data[key].group_update_date!==null)
        data[key].group_update_date = data[key].group_update_date.slice(0,19).replace('T',' ');
      else
        data[key].group_update_date="null";

      if(data[key].group_is_active)
          data[key].group_is_active = "true";
      else
          data[key].group_is_active = "false";

      if(data[key].group_status)
          data[key].group_status = "true";
      else
          data[key].group_status = "false";

      dataGroup[key] = {
        "group_id" : data[key].group_id,
  	    "group_name" : data[key].group_name,
  	    "group_is_active" : data[key].group_is_active,
        "group_status" : data[key].group_status.toString(),
        "group_create_date" : data[key].group_create_date,
        "group_update_date" : data[key].group_update_date
    };
  } callback(dataGroup)
}
//setting tampilan data member
function showMember(data,callback){
  Api_member.findById({"member_id": data.member_id}, function(err,dataMember){
    Api_group.findById({"group_id" : data.group_id}, function(err,dataGroup){
      Api_user.findById({"user_id" : data.user_id}, function(err,dataUser){
        var data = {};
        if(dataUser[0].user_lastname==null)
          dataUser[0].user_lastname="null"
        data.member_id = dataMember[0].member_id;
        data.group_name = dataGroup[0].group_name;
        data.user_id = dataUser[0].user_id;
        data.user_firstname = dataUser[0].user_firstname;
        data.user_lastname = dataUser[0].user_lastname;
        data.user_email = dataUser[0].user_email;

        if(dataMember[0].member_status==null)
          dataMember[0].member_status="null";
        if(dataMember[0].member_status_request==null)
          dataMember[0].member_status_request="null";

        data.member_status = dataMember[0].member_status;
        data.member_status_request = dataMember[0].member_status_request;
        data.member_role = dataMember[0].member_role;
        x(data);
      });
   });
 });

 function x(result){
   callback(result)
 }
}

function checkApikey(apikey, ipAddres, callback){
  Api_user.findWhere({"user_apikey" : apikey}, function(err, data){
    if(err){
      x(err);
    }else{
      if(data.length>0){
        //check user_role_id == 1 <-- admin/root
        if(data[0].user_role_id==1){
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
//check user ada atau tidak
function checkUser(user_id,callback){
    Api_user.findById({"user_id" : user_id},function(err,data){
        if(err){
          x(err);
        }else{
          if(data.length>0){
            x({"err_code": 0, "status": "User is Exist", "data" : data});
          }else{
            x({"err_code": 1, "status": "User ID is not found"});
          }
        }
    });

    function x(result){
		  callback(result)
	  }
}
//check role ada atau tidak
function checkRoleId(dataUser,callback){
  if(typeof dataUser.user_role_id !== 'undefined'){
    if(id.test(dataUser.user_role_id)){
      Api_role.findById({"role_id":dataUser.user_role_id},function(err,data){
        if(err)
          x(err)
        else{
          if(data.length>0){
            x({"err_code": 0, "status": "Role ID is Exist"});
          }else
            x({"err_code": 2, "status": "Role ID is doesn't Exist"});
        }
      });
    }else{
      x({"err_code": 2, "status": "Role ID must be numeric"});
    }
  }else{
    x({"err_code": 0, "status": "dataUser role id is undefined"});
  }

  function x(result){
	  callback(result)
  }
}
//check cluster ada atau tidak
function checkClusterId(dataUser,callback){
  if(typeof dataUser.user_cluster_id !== 'undefined'){
    if(id.test(dataUser.user_cluster_id)){
      Api_cluster.findById({"cluster_id":dataUser.user_cluster_id},function(err,data){
        if(err)
          x(err)
        else{
          if(data.length>0){
            x({"err_code": 0, "status": "Cluster ID is Exist"});
          }else
            x({"err_code": 2, "status": "Cluster ID is doesn't Exist"});
        }
      });
    }else{
      x({"err_code": 2, "status": "Cluster ID must be numeric"});
    }
  }else{
    x({"err_code": 0, "status": "dataUser cluster id is undefined"});
  }

  function x(result){
	  callback(result)
  }
}
//check group ada atau tidak
function checkGroup(group_id,callback){
    Api_group.findById({"group_id" : group_id},function(err,data){
        if(err){
          x(err);
        }else{
          if(data.length>0){
            x({"err_code": 0, "status": "Group is Exist", "data" : data});
          }else{
            x({"err_code": 1, "status": "Group id is not found"});
          }
        }
    });

    function x(result){
		  callback(result)
	  }
}
//check user sebagai member ada atau tidak
function checkUserAsMember(query,callback){
    Api_member.findWhereAnd(query,function(err,data){
        if(err){
          x(err);
        }else{
          if(data.length>0){
            x({"err_code": 0, "status": "User is already Exist as Member", "data" : data});
          }else{
            x({"err_code": 1, "status": "User is doesn't Exist as Member"});
          }
        }
    });

    function x(result){
		  callback(result)
	  }
}
//check member ada atau tidak
function checkMember(member_id,callback){
    Api_member.findById({"member_id" : member_id},function(err,data){
        if(err){
          x(err);
        }else{
          if(data.length>0){
            x({"err_code": 0, "status": "Member is Exist"});
          }else{
            x({"err_code": 1, "status": "Member is doesn't Exist"});
          }
        }
    });

    function x(result){
		  callback(result)
	  }
}

function checkEmail(apikey, email, callback){
   Api_user.findWhere({"user_email" : email}, function(err, data){
      if(err){
        x(err);
      }else{
        if(data.length > 0){
		  		x({"err_code": 2, "err_msg": "Email is already exist" });
		  	}else if(email==null||!valid.test(email)){
          x({"err_code": 3, "err_msg": "Email is invalid"});
        }else{
          x({"err_code": 0, "status": "Email is ready to use"});
        }
      }
  });

	function x(result){
		callback(result)
	}
}

function checkGroupName(apikey, group_name, callback){
  if(typeof group_name !== 'undefined'){
    Api_group.findWhere({"group_name" : group_name}, function(err,data){
      if(err){
        x(err);
      }else{
        if(data.length > 0){
  		  		var status = false;
  		  		for(i=0; i<data.length; i++){
  		  			if(data[i].group_name.toString().toLowerCase() == group_name.toString().toLowerCase()){
  		  				status = true;
  		  			}
  		  		}
  		  		if(status){
  		  			x({"err_code": 2, "status": "Group is already exist"});
  		  		}else{
  		  			x({"err_code": 0, "status": "Group is ready to use"});
  		  		}
  		  	}else{
  	  			x({"err_code": 0, "status": "Group is ready to use"});
  		  	}
      }
    });

  }else{
    x({"err_code": 0, "status": "Group name is undefined"});
  }
	function x(result){
		callback(result)
	}
}

function checkRoleName(apikey, role_name, callback){
	Api_role.findWhere({"role_name" : role_name}, function(err,data){
    if(err){
      x(err);
    }else{
      if(data.length > 0){
		  		var status = false;
		  		for(i=0; i<data.length; i++){
		  			if(data[i].role_name.toString().toLowerCase() == role_name.toString().toLowerCase()){
		  				status = true;
		  			}
		  		}
		  		if(status){
		  			x({"err_code": 2, "status": "Role is already exist"});
		  		}else{
		  			x({"err_code": 0, "status": "Role is ready to use"});
		  		}
		  	}else{
	  			x({"err_code": 0, "status": "Role is ready to use"});
		  	}
    }
  });

	function x(result){
		callback(result)
	}
}

function checkPrivilegeMenu(apikey, privilege_menu, callback){
	Api_privilege.findWhere({"privilege_menu" : privilege_menu}, function(err,data){
    if(err){
      x(err);
    }else{
      if(data.length > 0){
		  		var status = false;
		  		for(i=0; i<data.length; i++){
		  			if(data[i].privilege_menu.toString().toLowerCase() == privilege_menu.toString().toLowerCase()){
		  				status = true;
		  			}
		  		}
		  		if(status){
		  			x({"err_code": 2, "status": "Privilege menu is already exist"});
		  		}else{
		  			x({"err_code": 0, "status": "Privilege menu is ready to use"});
		  		}
		  	}else{
	  			x({"err_code": 0, "status": "Privilege menu is ready to use"});
		  	}
    }
  });

	function x(result){
		callback(result)
	}
}

function generateApikey(date){
	return md5(date);
}

function getFormattedDate() {
  var date = new Date();
  var str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +  date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

  return str;
}

function getUserId(apikey, callback){
	Api_user.findLastId('user_id',function(err,data){
    if(err){
      x(err);
    }else{
      if(data.length > 0){
        var user_id = parseInt(data[0].user_id) + 1;
	  		x({"err_code": 0, "user_id": user_id});
	  	}else{
	  		x({"err_code": 0, "user_id": 1});
	  	}
    }
  });

	function x(result){
		callback(result)
	}
}

function getGroupId(apikey, callback){
	Api_group.findLastId('group_id',function(err,data){
    if(err){
      x(err);
    }else{
      if(data.length > 0){
        var group_id = parseInt(data[0].group_id) + 1;
	  		x({"err_code": 0, "group_id": group_id});
	  	}else{
	  		x({"err_code": 0, "group_id": 1});
	  	}
    }
  });

  function x(result){
		callback(result)
	}
}

function getRoleId(apikey, callback){
	Api_role.findLastId('role_id',function(err,data){
    if(err){
      x(err);
    }else{
      if(data.length > 0){
        var role_id = parseInt(data[0].role_id) + 1;
	  		x({"err_code": 0, "role_id": role_id});
	  	}else{
	  		x({"err_code": 0, "role_id": 1});
	  	}
    }
  });

	function x(result){
		callback(result)
	}
}

function getPrivilageId(apikey, callback){
	Api_privilege.findLastId('privilege_id',function(err,data){
    if(err){
      x(err);
    }else{
      if(data.length > 0){
        var privilege_id = parseInt(data[0].privilege_id) + 1;
	  		x({"err_code": 0, "privilege_id": privilege_id});
	  	}else{
	  		x({"err_code": 0, "privilege_id": 1});
	  	}
    }
  });
  //method, endpoint, params, options, callback
  /*Api.get('get_privilage_id', {"apikey": apikey}, {}, function (error, response, body) {
	  if(error){
	  	x(error);
	  }else{
	  	privilege = JSON.parse(body);
	  	//cek apakah ada error atau tidak
	  	if(privilege.err_code == 0){
		  	//cek jumdata dulu
		  	if(privilege.data.length > 0){
		  		var privilege_id = parseInt(privilege.data[0].privilege_id) + 1;
		  		x({"err_code": 0, "privilege_id": privilege_id});
		  	}else{
		  		x({"err_code": 0, "privilege_id": 1});
		  	}
	  	}else{
	  		x({"err_code": 1, "err_msg": privilege.error, "application": "Api User Management", "function": "getPrivilageId"});
	  	}
	  }
	});*/

	function x(result){
		callback(result)
	}
}

function getMemberId(apikey, callback){
	Api_member.findLastId('member_id',function(err,data){
    if(err){
      x(err);
    }else{
      if(data.length > 0){
        var member_id = parseInt(data[0].member_id) + 1;
	  		x({"err_code": 0, "member_id": member_id});
	  	}else{
	  		x({"err_code": 0, "member_id": 1});
	  	}
    }
  });

	function x(result){
		callback(result)
	}
}

//get method
app.get('/:apikey/user/:user_id?', User.get);
app.get('/:apikey/group/:group_id?', Group.get.group);
app.get('/:apikey/group/:group_id?/user/:user_id', Group.get.groupByuser);
app.get('/:apikey/group/:group_id/member', Member.get);
app.get('/:apikey/role/:role_id?', Role.get);

//post method
app.post('/:apikey/user', User.post);
app.post('/:apikey/group', Group.post);
app.post('/:apikey/member', Member.post);
app.post('/:apikey/role', Role.post);
app.post('/:apikey/privilege/:role_id', Privilege.post);
app.post('/:apikey/login', Login.post);


//put method
app.put('/:apikey/user/:user_id?', User.put);
app.put('/:apikey/group/:group_id?', Group.put);
app.put('/:apikey/member/:member_id', Member.put);
app.put('/:apikey/role/:role_id?', Role.put);
app.put('/:apikey/privilege/:privilege_id?', Privilege.put);

//delete method
app.delete('/:apikey/user/:user_id?', User.delete);
app.delete('/:apikey/group/:group_id?', Group.delete);
app.delete('/:apikey/group/:group_id/member/:member_id?', Member.delete);
app.delete('/:apikey/role/:role_id?', Role.delete);


var server = app.listen(port, host, function () {
  console.log("Server running at http://%s:%s", host, port);
})

/*var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
})*/
