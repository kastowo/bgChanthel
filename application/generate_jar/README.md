1. Generate Jar
	- GET -> host:port/{apikey}/generate_jar/{project_id}/{inventory_id} 
    	project_id = mandatory (yes)
    	inventory_id = mandatory (yes)

    	url: 192.168.1.231:2006/90867b984d2a5038ee21a190996b900b/generate_jar/2/8
    	response: 
	    	{
				  "err_code": 0,
				  "data": [
				    {
				      "compile_id": "2",
				      "compile_name": "Kastowo_Project",
				      "compile_path": "/user/hdfs/baciro/jar/Kastowo_Project/",
				      "compile_type": "jar",
				      "compile_create_date": "2017-01-20 14:01:11",
				      "compile_update_date": "null",
				      "compile_project_id": "2",
				      "compile_inventory_id": "8"
				    }
				  ]
				}
	 	
			



		