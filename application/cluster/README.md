1. Cluster
	 	- GET Cluster -> host:port/{apikey}/cluster/{cluster_id} 
    	cluster_id = mandatory (no)

    	url: 192.168.1.231:2006/90867b984d2a5038ee21a190996b900b/cluster/1
    	response: 
	    	{
				  "err_code": 0,
				  "data": [
				    {
				      "cluster_id": "1",
				      "cluster_name": "yava01",
				      "cluster_status": "null",
				      "cluster_create_date": "2017-01-17 14:50:00",
				      "cluster_update_date": "2017-01-17 14:50:40"
				    }
				  ]
				}

		- GET Cluster_Config -> host:port/{apikey}/cluster/{cluster_id}/config/{config_id} 
		    	cluster_id = mandatory (yes)
		    	config_id = mandatory (no)

		    	url: 192.168.1.231:2006/90867b984d2a5038ee21a190996b900b/cluster/1/config
		    	response: 
			    	{
						  "err_code": 0,
						  "data": [
						    {
						      "cluster_id": "1",
						      "cluster_name": "yava01",
						      "config_id": "1",
						      "config_key": "namenode",
						      "config_value": "hdfs://192.168.1.230:8020",
						      "config_create_date": "2017-01-17 14:50:00",
						      "config_update_date": "2017-01-17 14:50:01"
						    },
						    {
						      "cluster_id": "1",
						      "cluster_name": "yava01",
						      "config_id": "2",
						      "config_key": "jobtracker",
						      "config_value": "192.168.1.231:8050",
						      "config_create_date": "2017-01-17 14:50:00",
						      "config_update_date": "2017-01-17 14:50:20"
						    },
						    {
						      "cluster_id": "1",
						      "cluster_name": "yava01",
						      "config_id": "3",
						      "config_key": "username",
						      "config_value": "yava",
						      "config_create_date": "2017-01-17 14:52:00",
						      "config_update_date": "2017-01-17 14:52:00"
						    },
						    {
						      "cluster_id": "1",
						      "cluster_name": "yava01",
						      "config_id": "4",
						      "config_key": "queuename",
						      "config_value": "level1",
						      "config_create_date": "2017-01-17 14:52:00",
						      "config_update_date": "2017-01-17 14:52:20"
						    },
						    {
						      "cluster_id": "1",
						      "cluster_name": "yava01",
						      "config_id": "5",
						      "config_key": "examplesroot",
						      "config_value": "ANANG",
						      "config_create_date": "2017-01-17 14:52:00",
						      "config_update_date": "2017-01-17 14:52:50"
						    },
						    {
						      "cluster_id": "1",
						      "cluster_name": "yava01",
						      "config_id": "6",
						      "config_key": "use_sys_libpath",
						      "config_value": "true",
						      "config_create_date": "2017-01-17 14:52:00",
						      "config_update_date": "2017-01-17 14:54:00"
						    },
						    {
						      "cluster_id": "1",
						      "cluster_name": "yava01",
						      "config_id": "7",
						      "config_key": "libpath",
						      "config_value": "${nameNode}/user/${user.name}/${examplesRoot}/testoozie/hgrid/lib/hgrid",
						      "config_create_date": "2017-01-17 14:52:00",
						      "config_update_date": "2017-01-17 14:54:00"
						    },
						    {
						      "cluster_id": "1",
						      "cluster_name": "yava01",
						      "config_id": "8",
						      "config_key": "wf_path",
						      "config_value": "${nameNode}/yava/faroh/workflow.xml",
						      "config_create_date": "2017-01-17 14:52:00",
						      "config_update_date": "2017-01-17 14:54:00"
						    },
						    {
						      "cluster_id": "1",
						      "cluster_name": "yava01",
						      "config_id": "9",
						      "config_key": "hostname_oozie",
						      "config_value": "192.168.1.231",
						      "config_create_date": "2017-01-17 14:52:00",
						      "config_update_date": "2017-01-17 14:54:00"
						    },
						    {
						      "cluster_id": "1",
						      "cluster_name": "yava01",
						      "config_id": "10",
						      "config_key": "port_oozie",
						      "config_value": "11000",
						      "config_create_date": "2017-01-17 14:52:00",
						      "config_update_date": "2017-01-17 14:54:00"
						    }
						  ]
						}



		- POST Cluster -> host:port/{apikey}/cluster
    	url: 192.168.1.231:2006/90867b984d2a5038ee21a190996b900b/cluster
    	cluster_status bisa dikosongkan, setting default hanya boleh ada 1 cluster yang active
    	request: {
    							"cluster_name": "Yava02",
    							"cluster_status": "default"
    					}

    	response: {
								  "err_code": 0,
								  "status": "Cluster add is succes "
								}

		- POST Cluster_Config -> host:port/{apikey}/cluster/{cluster_id}/config
    	url: 192.168.1.231:2006/90867b984d2a5038ee21a190996b900b/cluster/2/config
    	
    	request: {
									"config_key": "namenode",
									"config_value": "namenode value"
								}

    	response: {
								  "err_code": 0,
								  "status": "Config add is succes "
								}
		
		- PUT Cluster -> host:port/{apikey}/cluster/{cluster_id}
    	url: 192.168.1.231:2006/90867b984d2a5038ee21a190996b900b/cluster/1
    	cluster_status bisa dikosongkan, setting default hanya boleh ada 1 cluster yang active
    	request: {
    							"cluster_name": "Yava002",
    							"cluster_status": ""
    					}

    	response: {
								  "err_code": 0,
								  "status": "Cluster have been updated"
								}

		- PUT Cluster_Config -> host:port/{apikey}/cluster/{cluster_id}/config/{config_id}
		    	url: 192.168.1.231:2006/90867b984d2a5038ee21a190996b900b/cluster/2/config/11
		    	request: {
		    							"config_key": "namenode2",
		    							"config_value": "kosong aja deh"
		    					}

		    	response: {
										  "err_code": 0,
										  "status": "Config have been updated"
										}

		- Delete Cluster -> host:port/{apikey}/cluster/{cluster_id}
    	url: 192.168.1.231:2006/90867b984d2a5038ee21a190996b900b/cluster/1

    	response: {
								  "err_code": 0,
								  "status": "Cluster is deleted"
								}

		- Delete Cluster_Config -> host:port/{apikey}/cluster/{cluster_id}/config/{config_id}
			Warning!!!!
			- Jika ingin menghapus semua config dari suatu cluster, maka config_id tidak usah diisi.
			- Jika anda mengisi config_id, maka config dengan id tersebut yang akan dihapus.

			cluster_id : Mandatory (Yes)
			config_id : Mandatory (No)
    	url: 192.168.1.231:2006/90867b984d2a5038ee21a190996b900b/cluster/2/13

    	response: {
								  "err_code": 0,
								  "status": "Config is deleted"
								}

								
