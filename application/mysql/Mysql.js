var path = require("path");
var Database = require("baciro-orm");
var conf = {
  host : 'localhost',
  port : 3306,
  name : 'baciro_orm',
  user : 'root',
  pass : 'root',
  type : 'mysql'
};
var db = new Database(conf, path.resolve('../config/schema.js'));

function Model(schemaName){
  return db.model(schemaName);
}

exports = module.exports = Model;