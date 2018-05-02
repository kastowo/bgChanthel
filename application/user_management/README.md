1. User Management
	  User
	 	- GET User -> host:port/{apikey}/user/{user_id}
    	url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/user/1
    	response: [
								    {
									    "user_id": "1",
									    "user_firstname": "Danang",
									    "user_lastname": "Kastowo",
									    "user_email": "danang.kastowo@solusi247.com",
									    "user_apikey": "90867b984d2a5038ee21a190996b900b",
									    "user_ip_address": "192.168.1.143,192.168.1.193",
									    "user_create_date": "2016-10-17 12:24:44",
									    "user_update_date": "null",
									    "user_is_active": "true"
									  }
								]
		- POST User -> host:port/{apikey}/user
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/user
    	request: 
				    	{
								"user_firstname": "Kastowo",
								"user_lastname": "Saja",
								"user_email": "kastowoayani@gmail.com",
								"user_password": "kastowo123",
								"user_ip_address": "192.168.1.212"
							}
    	response: 
				    	{
							  "err_code": 0,
							  "status": "User add is succes "
							}

		- PUT User -> host:port/{apikey}/user/{user_id}
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/user/1
    	request: 
				    	{
								"user_firstname": "Kastowo"
							}
    	response: 
				    	{
							  "err_code": 0,
							  "status": "User have been update"
							}

		- DELETE User -> host:port/{apikey}/user/{user_id}
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/user/1				
			response: {
								  "err_code": 0,
								  "status": "User is deleted"
								}
			
		Group				
		- GET Group -> host:port/{apikey}/group/{group_id}
    	request: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/group/1
    	response: [
								  {
								    "group_id": "1",
								    "group_name": "baciro",
								    "group_is_active": "true",
								    "group_status": "true"
								  }
								]

		- POST Group -> host:port/{apikey}/group
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/group
    	request: 
				    	{
								"group_name": "Baciro2",
								"group_status": true
							}
    	response: 
				    	{
							  "err_code": 0,
							  "status": "Group add is succes "
							}						

		- PUT Group -> host:port/{apikey}/group/{group_id}
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/group/1
    	request: 
				    	{
								"group_name": "Baciro22"
								
							}
    	response: 
				    	{
							  "err_code": 0,
							  "status": "Group have been update"
							}						

		- DELETE Group -> host:port/{apikey}/group/{group_id}				

			response: 
			    	{
						  "err_code": 0,
						  "status": "Group is deleted"
						}					
	
	  Member
	  - GET Member -> host:port/{apikey}/member/{group_id}
	  	url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/member/1
	    response:
	    [
			  {
			    "member_id": "1",
			    "group_name": "Baciro2",
			    "user_firstname": "Hardika,HCS,HCS",
			    "user_lastname": "Catur Sapta, HCS, HCS, HCS",
			    "user_email": "hardika.sapta@solusi247.com"
			  },
			  {
			    "member_id": "2",
			    "group_name": "Baciro2",
			    "user_firstname": "Administrator",
			    "user_lastname": "null",
			    "user_email": "danang.kastowo@solusi247.com"
			  }
			]

		- POST Member -> host:port/{apikey}/member
	  	url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/member
	    request: 
				    	{
								"user_id": 1,
								"group_id":1,
								"create_by" : "Danang Kastowo"
							}

			response: 
				    	{
							  "err_code": 0,
							  "status": "Member have been create"
							}

	  - PUT Member -> host:port/{apikey}/member/{member_id}
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/group/1
    	request: 
				    	{
								"user_id": 1,
								"group_id": 1,
								"update_by": "Danang Kastowo"
							}
    	response: 
				    	{
							  "err_code": 0,
							  "status": "Member have been create"
							}						
		- Delete Member -> host:port/{apikey}/member/{member_id}
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/member/1
    	request: 
				    	{
								"user_id": 1
							}
    	response: 
				    	{
							  "err_code": 0,
							  "status": "Member have been delete"
							}						

		Role
		- GET Role -> host:port/{apikey}/role/{role_id}
    	url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/role/1
    	response: [
								  {
								    "role_id": "1",
								    "role_name": "Administrator",
								    "role_create_date": "2016-10-25 13:20:28",
								    "role_update_date": "2016-10-25 13:41:13",
								    "privilege_menu": "null",
								    "privilege_view": "null",
								    "privilege_create": "null",
								    "privilege_update": "null",
								    "privilege_delete": "null"
								  }
								]
		- POST Role -> host:port/{apikey}/role
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/role
    	request: 
				    	{
								"role_name": "Administrator", // Administrator, Operator, Manager, 

							}
    	response: 
				    	{
							  "err_code": 0,
							  "status": "Role add is succes "
							}

		- PUT Role -> host:port/{apikey}/role/{role_id}
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/role/1
    	request: 
				    	{
								"role_name": "Manager"
							}
    	response: 
				    	{
							  "err_code": 0,
							  "status": "Role have been update"
							}

		- DELETE Role -> host:port/{apikey}/role/{role_id}
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/role/1				
			response: {
								  "err_code": 0,
								  "status": "Role is deleted"
								}							

		Privilage
		-	POST Role -> host:port/{apikey}/privilage/{role_id}
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/privilage/1
    	request: 
				    	{
								"privilege_menu": "*"
							}

							atau 

							{
								"privilege_menu": "application",
								"privilege_view": true,
								"privilege_create": true,
								"privilege_update": true,
								"privilege_delete": true
							}

							* : All setting diijinkan mengakses 
    	response: 
				    	{
							  "err_code": 0,
							  "status": "Role add is succes "
							}		

		-	PUT Role -> host:port/{apikey}/privilage/{privilege_id}
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/privilage/2
    	request: 
				    	{
								"privilege_menu": "*"
							}

							atau 

							{
								"privilege_menu": "application",
								"privilege_view": true,
								"privilege_create": true,
								"privilege_update": true,
								"privilege_delete": true
							}

							* : All setting diijinkan mengakses 
    	response: 
				    	{
							  "err_code": 0,
							  "status": "Role add is succes "
							}					



		