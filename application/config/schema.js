
//schema Application
exports.Application = function Application(){
	schema = {
				"application_id" : { "type" : "Integer", "index": true, "primaryKey": true, "autoIncrement": true },
				"application_name" : "String(255)",
				"application_is_active" : "Boolean",
				"application_running_date" : "Date"
	};
	return schema;
};

//schema Job 
exports.Job = function Job(){
	schema = {
				"oozie_job_id" :{ "type" : "String", "index": true, "primaryKey": true},
				"job_name" : "String(255)",
				"job_actions" : "String(255)",
				"job_status" : "String(255)",
				"job_project_id" : "Integer",
				"application_job_id" : "Integer",
				"job_create_date" : "Date",
				"job_update_date" : "Date",
				"user_id" : "Integer",
				"job_workflow" : "String(255)"
			};
	return schema;
};

//schema Log 
exports.Log = function Log(){
	schema = {
				"log_id" : { "type": "Integer", "index": true, "primaryKey": true},
				"log_name" : "String(255)",
				"log_status" : "String(255)",
				"log_node" : "Integer"
			};
	return schema;
};

//schema Role 
exports.Role = function Role(){
	schema = {
				"role_id" : { "type": "Integer", "index": true, "primaryKey": true, "autoIncrement": true },
				"role_name" : "String(255)",
				"role_create_date" : "Date",
				"role_update_date" : "Date"
			};
	return schema;
};

//schema Member
exports.Member = function Member(){
	schema = {	
				"member_id" : { "type": "Integer", "index": true, "primaryKey": true, "autoIncrement": true }, 
				"member_create_date" : "Date",
				"member_update_date" : "Date",
				"user_id" :	"Integer",
				"group_id" : "Integer",
        "member_status" : "String(255)",
        "member_status_request" : "String(255)",
        "member_role"  : "String(255)"
			};
	return schema;
};

//schema Privilege
exports.Privilege = function Privilege(){
	schema = {
				"privilege_id" : { "type": "Integer", "index": true, "primaryKey": true, "autoIncrement": true }, 
				"privilege_menu" : "String(255)",
				"privilege_view" : "boolean",
				"privilege_create" : "boolean",
				"privilege_delete" : "boolean",
				"privilege_update" : "boolean",
        "privilege_role_id" : "Integer",
				"privilege_create_date" : "Date", 
				"privilege_update_date" : "Date"
			};
	return schema;
};

//schema Project 
exports.Project = function Project(){
	schema = {
				"project_id" : { "type": "Integer", "index": true, "primaryKey": true, "autoIncrement": true },
				"project_name" : "String(255)",
				"project_create_date" : "Date",
				"project_update_date" : "Date",
				"project_is_share" : "Boolean",
				"project_user_id" : "Integer",
				"project_group_id" : "Integer"
			};
	return schema;
};

//schema User
exports.User = function User(){
	schema = {
				"user_id" : { "type": "Integer", "index": true, "primaryKey": true, "autoIncrement": true },
				"user_firstname" : "String(255)",
				"user_lastname" : "String(255)",
				"user_email" : "String(255)",
				"user_password" : "String(255)",
				"user_create_date" : "Date",
				"user_is_active" : "Boolean",
				"user_mac_address" : "String(255)",
				"user_ip_address" : "String(255)",
				"user_apikey" : "String(255)",
				"user_update_date" : "Date",
				"user_role_id" : "Integer",
        "user_cluster_id" : "Integer"
			};
	return schema;
};

//schema Compile 
exports.Compile = function Compile(){
	schema = {
				"compile_id" : { "type": "Integer", "index": true, "primaryKey": true, "autoIncrement": true },
				"compile_name" : "String(255)",
				"compile_path" : "String(255)",
				"compile_type" : "String(255)",
				"compile_create_date" : "Date",
				"compile_update_date" : "Date",
				"compile_project_id" : "Integer",
				"compile_inventory_id" : "Integer"
			};
	return schema;
};

//schema Cluster
exports.Cluster = function Cluster(){
	schema = {
				"cluster_id" : { "type": "Integer", "index": true, "primaryKey": true, "autoIncrement": true },
				"cluster_name" : "String(255)",
				"cluster_status" : "String(255)",
				"cluster_create_date" : "Date",
				"cluster_update_date" : "Date"
			};
	return schema;
};

//schema Config 
exports.Config = function Config(){
	schema = {
				"config_id" : { "type": "Integer", "index": true, "primaryKey": true, "autoIncrement": true },
				"config_create_date" : "Date",
				"config_update_date" : "Date",
				"config_key" : "String(255)",
				"config_value" : "String(255)",
				"config_cluster_id" : "Integer"
			};
	return schema;
};

//schema Group
exports.Group = function Group(){
	schema = {
				"group_id" : { "type": "Integer", "index": true, "primaryKey": true, "autoIncrement": true },
				"group_name" : "String(255)",
				"group_status" : "Boolean",
				"group_is_active" : "Boolean",
				"group_create_date" : "Date",
				"group_update_date" : "Date",
        "group_user_id" : "Integer"
			};
	return schema;
};

//schema Inventory
exports.Inventory = function Inventory(){
	schema = {
				"inventory_id" : { "type": "Integer", "index": true, "primaryKey": true, "autoIncrement": true },
				"inventory_name" : "String(255)",
				"inventory_path" : "String(255)",
				"inventory_type" : "String(255)",
				"inventory_version" : "Boolean",
				"inventory_create_date" : "Date",
				"inventory_update_date" : "Date",
				"project_inventory_id" : "Integer",
				"inventory_package" : "TEXT"			
			};
	return schema;
};
