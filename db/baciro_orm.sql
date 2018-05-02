-- MySQL dump 10.14  Distrib 5.5.50-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: vgrid
-- ------------------------------------------------------
-- Server version	5.5.50-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Application`
--

DROP TABLE IF EXISTS `Application`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Application` (
  `application_id` int(11) NOT NULL AUTO_INCREMENT,
  `application_name` varchar(255) DEFAULT NULL,
  `application_is_active` tinyint(1) DEFAULT NULL,
  `application_running_date` datetime DEFAULT NULL,
  PRIMARY KEY (`application_id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Application`
--

LOCK TABLES `Application` WRITE;
/*!40000 ALTER TABLE `Application` DISABLE KEYS */;
/*!40000 ALTER TABLE `Application` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Cluster`
--

DROP TABLE IF EXISTS `Cluster`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Cluster` (
  `cluster_id` int(11) NOT NULL AUTO_INCREMENT,
  `cluster_name` varchar(255) DEFAULT NULL,
  `cluster_status` varchar(255) DEFAULT NULL,
  `cluster_create_date` datetime DEFAULT NULL,
  `cluster_update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`cluster_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Cluster`
--

LOCK TABLES `Cluster` WRITE;
/*!40000 ALTER TABLE `Cluster` DISABLE KEYS */;
INSERT INTO `Cluster` VALUES (1,'Yava02','default','2017-01-17 00:00:00','2017-02-16 09:30:42');
/*!40000 ALTER TABLE `Cluster` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Compile`
--

DROP TABLE IF EXISTS `Compile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Compile` (
  `compile_id` int(11) NOT NULL AUTO_INCREMENT,
  `compile_name` varchar(255) DEFAULT NULL,
  `compile_path` varchar(255) DEFAULT NULL,
  `compile_type` varchar(255) DEFAULT NULL,
  `compile_create_date` datetime DEFAULT NULL,
  `compile_update_date` datetime DEFAULT NULL,
  `compile_project_id` int(11) DEFAULT NULL,
  `compile_inventory_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`compile_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Compile`
--

LOCK TABLES `Compile` WRITE;
/*!40000 ALTER TABLE `Compile` DISABLE KEYS */;
/*!40000 ALTER TABLE `Compile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Config`
--

DROP TABLE IF EXISTS `Config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Config` (
  `config_id` int(11) NOT NULL AUTO_INCREMENT,
  `config_create_date` datetime DEFAULT NULL,
  `config_update_date` datetime DEFAULT NULL,
  `config_key` varchar(255) DEFAULT NULL,
  `config_value` varchar(255) DEFAULT NULL,
  `config_cluster_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`config_id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Config`
--

LOCK TABLES `Config` WRITE;
/*!40000 ALTER TABLE `Config` DISABLE KEYS */;
INSERT INTO `Config` VALUES (1,'2017-02-01 06:08:04','2017-02-17 17:17:56','usernameOozie','yava',1),(2,'2017-02-01 06:08:43','2017-02-13 16:04:04','nameNode','hdfs://192.168.1.230:8020',1),(3,'2017-02-01 06:09:05','2017-02-13 16:04:23','jobTracker','192.168.1.231:8050',1),(4,'2017-02-13 16:07:00',NULL,'hostnameOozie','192.168.1.231',1),(5,'2017-02-13 16:07:26',NULL,'portOozie','11000',1),(6,'2017-02-13 16:08:42',NULL,'portHdfs','50070',1),(7,'2017-02-13 16:09:05','2017-02-17 18:04:19','usernameHdfs','yava',1),(8,'2017-02-13 16:09:19',NULL,'queueName','level1',1),(9,'2017-02-13 16:09:46',NULL,'hostnameHdfs','192.168.1.230',1),(10,'2017-02-17 18:00:18',NULL,'oozieLibpath','${nameNode}/user/yava/oozie/hgrid/lib',1),(11,'2017-02-17 17:58:47',NULL,'useSystemLibpath','true',1);
/*!40000 ALTER TABLE `Config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Group`
--

DROP TABLE IF EXISTS `Group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Group` (
  `group_id` int(11) NOT NULL AUTO_INCREMENT,
  `group_name` varchar(255) DEFAULT NULL,
  `group_status` tinyint(1) DEFAULT NULL,
  `group_is_active` tinyint(1) DEFAULT NULL,
  `group_create_date` datetime DEFAULT NULL,
  `group_update_date` datetime DEFAULT NULL,
  `group_user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Group`
--

LOCK TABLES `Group` WRITE;
/*!40000 ALTER TABLE `Group` DISABLE KEYS */;
/*!40000 ALTER TABLE `Group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Inventory`
--

DROP TABLE IF EXISTS `Inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Inventory` (
  `inventory_id` int(11) NOT NULL AUTO_INCREMENT,
  `inventory_name` varchar(255) DEFAULT NULL,
  `inventory_path` varchar(255) DEFAULT NULL,
  `inventory_type` varchar(255) DEFAULT NULL,
  `inventory_version` tinyint(1) DEFAULT NULL,
  `inventory_create_date` datetime DEFAULT NULL,
  `inventory_update_date` datetime DEFAULT NULL,
  `project_inventory_id` int(11) DEFAULT NULL,
  `inventory_package` longtext,
  PRIMARY KEY (`inventory_id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Inventory`
--

LOCK TABLES `Inventory` WRITE;
/*!40000 ALTER TABLE `Inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `Inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Job`
--

DROP TABLE IF EXISTS `Job`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Job` (
  `oozie_job_id` varchar(255) NOT NULL,
  `job_name` varchar(255) DEFAULT NULL,
  `job_actions` varchar(255) DEFAULT NULL,
  `job_status` varchar(255) DEFAULT NULL,
  `job_project_id` int(11) DEFAULT NULL,
  `application_job_id` int(11) DEFAULT NULL,
  `job_create_date` datetime DEFAULT NULL,
  `job_update_date` datetime DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `job_workflow` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`oozie_job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Job`
--

LOCK TABLES `Job` WRITE;
/*!40000 ALTER TABLE `Job` DISABLE KEYS */;
/*!40000 ALTER TABLE `Job` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Log`
--

DROP TABLE IF EXISTS `Log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Log` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `log_name` varchar(255) DEFAULT NULL,
  `log_status` varchar(255) DEFAULT NULL,
  `log_node` int(11) DEFAULT NULL,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Log`
--

LOCK TABLES `Log` WRITE;
/*!40000 ALTER TABLE `Log` DISABLE KEYS */;
/*!40000 ALTER TABLE `Log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Member`
--

DROP TABLE IF EXISTS `Member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Member` (
  `member_id` int(11) NOT NULL AUTO_INCREMENT,
  `member_create_date` datetime DEFAULT NULL,
  `member_update_date` datetime DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `group_id` int(11) DEFAULT NULL,
  `member_status` varchar(255) DEFAULT NULL,
  `member_status_request` varchar(255) DEFAULT NULL,
  `member_role` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`member_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Member`
--

LOCK TABLES `Member` WRITE;
/*!40000 ALTER TABLE `Member` DISABLE KEYS */;
/*!40000 ALTER TABLE `Member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Privilege`
--

DROP TABLE IF EXISTS `Privilege`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Privilege` (
  `privilege_id` int(11) NOT NULL AUTO_INCREMENT,
  `privilege_menu` varchar(255) DEFAULT NULL,
  `privilege_view` tinyint(1) DEFAULT NULL,
  `privilege_create` tinyint(1) DEFAULT NULL,
  `privilege_update` tinyint(1) DEFAULT NULL,
  `privilege_delete` tinyint(1) DEFAULT NULL,
  `privilege_role_id` int(11) DEFAULT NULL,
  `privilege_create_date` datetime DEFAULT NULL,
  `privilege_update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`privilege_id`)
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Privilege`
--

LOCK TABLES `Privilege` WRITE;
/*!40000 ALTER TABLE `Privilege` DISABLE KEYS */;
/*!40000 ALTER TABLE `Privilege` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Project`
--

DROP TABLE IF EXISTS `Project`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Project` (
  `project_id` int(11) NOT NULL AUTO_INCREMENT,
  `project_name` varchar(255) DEFAULT NULL,
  `project_create_date` datetime DEFAULT NULL,
  `project_update_date` datetime DEFAULT NULL,
  `project_is_share` tinyint(1) DEFAULT NULL,
  `project_user_id` int(11) DEFAULT NULL,
  `project_group_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`project_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Project`
--

LOCK TABLES `Project` WRITE;
/*!40000 ALTER TABLE `Project` DISABLE KEYS */;
/*!40000 ALTER TABLE `Project` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Role`
--

DROP TABLE IF EXISTS `Role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Role` (
  `role_id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(255) DEFAULT NULL,
  `role_create_date` datetime DEFAULT NULL,
  `role_update_date` datetime DEFAULT NULL,
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Role`
--

LOCK TABLES `Role` WRITE;
/*!40000 ALTER TABLE `Role` DISABLE KEYS */;
INSERT INTO `Role` VALUES (1,'Administrator','2017-02-16 10:46:00',NULL),(2,'Operator','2017-02-16 10:47:00',NULL);
/*!40000 ALTER TABLE `Role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `User` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_firstname` varchar(255) DEFAULT NULL,
  `user_lastname` varchar(255) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_password` varchar(255) DEFAULT NULL,
  `user_create_date` datetime DEFAULT NULL,
  `user_is_active` tinyint(1) DEFAULT NULL,
  `user_mac_address` varchar(255) DEFAULT NULL,
  `user_ip_address` varchar(255) DEFAULT NULL,
  `user_apikey` varchar(255) DEFAULT NULL,
  `user_update_date` datetime DEFAULT NULL,
  `user_role_id` int(11) DEFAULT NULL,
  `user_cluster_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (1,'Danang','Kastowo','danang.kastowo@solusi247.com',NULL,'2016-10-17 00:00:00',1,NULL,'192.168.1.80,192.168.1.72,192.168.1.75','90867b984d2a5038ee21a190996b900b','2017-02-16 10:47:48',1,NULL);
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-07-18 10:09:23
