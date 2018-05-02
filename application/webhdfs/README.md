1. Project
	 	- GET projectbyUser -> host:port/{apikey}/project/{project_id}/user/{user_id} 
    	project_id = mandatory (no)
    	user_id = mandatory (yes)

    	url: 192.168.1.231:3004/90867b984d2a5038ee21a190996b900b/project/1/user/1
    	response: 

    - GET projectbyGroup -> host:port/{apikey}/project/{project_id}/group/{group_id} 
    	project_id = mandatory (no)
    	group_id = mandatory (yes)

    	url: 192.168.1.231:3004/90867b984d2a5038ee21a190996b900b/project/1/group/1
    	response: 
    
    - Get Project and Inventory
    	url: 192.168.1.231:3004/90867b984d2a5038ee21a190996b900b/project/1/inventory/1
    	

		- POST 
			- addProject -> host:port/{apikey}/project/user/{user_id}
				url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/project/user/1
	    	request: 
					    	{
									"project_name": "Kastowo Project"								
								}
	    	response: 
					    	{
								  "err_code": 0,
								  "status": "Project add is succes "
								}

			- addInventory -> host:port/{apikey}/project/{project_id}/inventory
				url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/project/1/inventory
	    	request: 
					    	{
									"inventory_name": "Kastowo Workflow",
									"inventory_type": "csd",
									"inventory_package": "<?xml version=\"1.0\"?>
																			    <HGrid247>
																			        <Each>
																			            <name> Transformator_1423721977740</name>
																			            <ID> 1423721977740</ID>
																			            <label> Transformator_1</label>
																			            <prevPipe> </prevPipe>
																			           <type> EACH</type>
																			            <pipeName> Transformator_1423721977740</pipeName>
																			            <maxPrevNode> 1</maxPrevNode>
																			            <flowName> </flowName>
																			            <inFields> line</inFields>
																			            <outFields> TANGGAL,KOTA,SALES_ID,ITEM_ID,UNIT,HARGA_UNIT</outFields>
																			            <inFieldsType> String</inFieldsType>
																			            <outFieldsType> String,String,String,String,Integer,String</outFieldsType>
																			            <posx> 270.0</posx>
																			            <posy> 195.0</posy>
																			            <tinggi> 45</tinggi>
																			            <lebar> 100</lebar>
																			            <enabled> true</enabled>
																			            <enabledCounter> true</enabledCounter>
																			            <description> </description>
																			            <argumentSelector> </argumentSelector>
																			            <outputSelector> </outputSelector>
																			            <fieldDeclaration> </fieldDeclaration>
																			            <posxIR> 22</posxIR>
																			            <posyIR> 22</posyIR>
																			            <posxOR> 500</posxOR>
																			            <posyOR> 20</posyOR>
																			            <widhtIR> 200</widhtIR>
																			            <heightIR> 37</heightIR>
																			            <widthOR> 200</widthOR>
																			            <heightOR> 126</heightOR>
																			            <filterInstance> </filterInstance>
																			            <chaining> false</chaining>
																			        </Each>
																			        <Transform>
																			            <parentID> 1423721977740</parentID>
																			            <prevIDS> </prevIDS>
																			            <nextIDS> </nextIDS>
																			            <ID> 1423722031517</ID>
																			            <name> RegexSplitter</name>
																			            <label> RegexSplitter(|)</label>
																			            <input> line</input>
																			            <output> TANGGAL, KOTA, SALES_ID, ITEM_ID, UNIT, HARGA_UNIT</output>
																			            <parameter> |</parameter>
																			            <posx> 267</posx>
																			            <posy> 110</posy>
																			            <inputCount> 1</inputCount>
																			            <outputCount> 2</outputCount>
																			            <codeString> </codeString>
																			            <expressionString> </expressionString>
																			            <defaultString> </defaultString>
																			            <extraInfo> </extraInfo>
																			            <udf> false</udf>
																			        </Transform>
																			        <Each>
																			            <name> Transformator_1423722141538</name>
																			            <ID> 1423722141538</ID>
																			            <label> Transformator_2</label>
																			            <prevPipe> Transformator_1423721977740</prevPipe>
																			           <type> EACH</type>
																			            <pipeName> </pipeName>
																			            <maxPrevNode> 1</maxPrevNode>
																			            <flowName> </flowName>
																			            <inFields> TANGGAL,KOTA,SALES_ID,ITEM_ID,UNIT,HARGA_UNIT</inFields>
																			            <outFields> TANGGAL,KOTA,SALES_ID,ITEM_ID,UNIT,HARGA_UNIT,HARGA</outFields>
																			            <inFieldsType> String,String,String,String,Integer,String</inFieldsType>
																			            <outFieldsType> String,String,String,String,Integer,String,Double</outFieldsType>
																			            <posx> 438.0</posx>
																			            <posy> 194.0</posy>
																			            <tinggi> 45</tinggi>
																			            <lebar> 100</lebar>
																			            <enabled> true</enabled>
																			            <enabledCounter> true</enabledCounter>
																			            <description> </description>
																			            <argumentSelector> TANGGAL,KUOTA,SALES_ID,ITEM_ID,UNIT,HARGA_UNIT</argumentSelector>
																			            <outputSelector> </outputSelector>
																			            <fieldDeclaration> </fieldDeclaration>
																			            <posxIR> 22</posxIR>
																			            <posyIR> 22</posyIR>
																			            <posxOR> 500</posxOR>
																			            <posyOR> 20</posyOR>
																			            <widhtIR> 225</widhtIR>
																			            <heightIR> 122</heightIR>
																			            <widthOR> 217</widthOR>
																			            <heightOR> 144</heightOR>
																			            <filterInstance> </filterInstance>
																			            <chaining> false</chaining>
																			        </Each>
																			        <Transform>
																			            <parentID> 1423722141538</parentID>
																			            <prevIDS> </prevIDS>
																			            <nextIDS> </nextIDS>
																			            <ID> 1423722169874</ID>
																			            <name> Calculation</name>
																			            <label> Calculation(UNIT*HARGA_UNIT)</label>
																			            <input> </input>
																			            <output> HARGA</output>
																			            <parameter> *(HARGA_UNIT UNIT)</parameter>
																			            <posx> 231</posx>
																			            <posy> 221</posy>
																			            <inputCount> 0</inputCount>
																			            <outputCount> 2</outputCount>
																			            <codeString> ,UNIT,*,;,HARGA_UNIT,,;</codeString>
																			            <expressionString> </expressionString>
																			            <defaultString> </defaultString>
																			            <extraInfo> </extraInfo>
																			            <udf> false</udf>
																			        </Transform>
																			        <Identity>
																			            <parentID> 1423722141538</parentID>
																			            <fromField> TANGGAL</fromField>
																			            <toField> TANGGAL</toField>
																			        </Identity>
																			        <Identity>
																			            <parentID> 1423722141538</parentID>
																			            <fromField> KOTA</fromField>
																			            <toField> KOTA</toField>
																			        </Identity>
																			        <Identity>
																			            <parentID> 1423722141538</parentID>
																			            <fromField> SALES_ID</fromField>
																			            <toField> SALES_ID</toField>
																			        </Identity>
																			        <Identity>
																			            <parentID> 1423722141538</parentID>
																			            <fromField> ITEM_ID</fromField>
																			            <toField> ITEM_ID</toField>
																			        </Identity>
																			        <Identity>
																			            <parentID> 1423722141538</parentID>
																			            <fromField> UNIT</fromField>
																			            <toField> UNIT</toField>
																			        </Identity>
																			        <Identity>
																			            <parentID> 1423722141538</parentID>
																			            <fromField> HARGA_UNIT</fromField>
																			            <toField> HARGA_UNIT</toField>
																			        </Identity>
																			        <Combiner>
																			            <name> Combiner_1429081436373</name>
																			            <ID> 1429081436373</ID>
																			            <label> Combiner_2</label>
																			            <prevPipe> Transformator_1423722141538</prevPipe>
																			           <type> COMBINER</type>
																			            <pipeName> </pipeName>
																			            <maxPrevNode> 1</maxPrevNode>
																			            <flowName> </flowName>
																			            <inFields> TANGGAL,KOTA,SALES_ID,ITEM_ID,UNIT,HARGA_UNIT,HARGA</inFields>
																			            <outFields> KOTA,SALES_ID,HARGA</outFields>
																			            <inFieldsType> String,String,String,String,Integer,String,Double</inFieldsType>
																			            <outFieldsType> String,String,Double</outFieldsType>
																			            <posx> 624.0</posx>
																			            <posy> 193.0</posy>
																			            <tinggi> 45</tinggi>
																			            <lebar> 73</lebar>
																			            <enabled> true</enabled>
																			            <enabledCounter> true</enabledCounter>
																			            <description> </description>
																			            <argumentSelector> </argumentSelector>
																			            <outputSelector> </outputSelector>
																			            <fieldDeclaration> </fieldDeclaration>
																			            <groupField> KOTA,SALES_ID</groupField>
																			            <combinerField> HARGA</combinerField>
																			            <combinerType> Sum</combinerType>
																			            <input2Output> KOTA,SALES_ID,HARGA</input2Output>
																			            <maxCombineGroup> 5000</maxCombineGroup>
																			            <posxIR> 22</posxIR>
																			            <posyIR> 22</posyIR>
																			            <posxOR> 500</posxOR>
																			            <posyOR> 20</posyOR>
																			            <widhtIR> 234</widhtIR>
																			            <heightIR> 139</heightIR>
																			            <widthOR> 234</widthOR>
																			            <heightOR> 139</heightOR>
																			        </Combiner>
																			        <AggregateCombiner>
																			            <parentID> 1429081436373</parentID>
																			            <ID> 1429081454359</ID>
																			            <name> Sum</name>
																			            <label> Sum</label>
																			            <input> HARGA</input>
																			            <output> HARGA</output>
																			            <parameter> </parameter>
																			            <posx> 333</posx>
																			            <posy> 92</posy>
																			            <conditionType> 0</conditionType>
																			            <condition> </condition>
																			        </AggregateCombiner>
																			        <IdentityAggCombiner>
																			            <parentID> 1429081436373</parentID>
																			            <fromField> KOTA</fromField>
																			            <toField> KOTA</toField>
																			        </IdentityAggCombiner>
																			        <IdentityAggCombiner>
																			            <parentID> 1429081436373</parentID>
																			            <fromField> SALES_ID</fromField>
																			            <toField> SALES_ID</toField>
																			        </IdentityAggCombiner>
																			        <Groupby>
																			            <name> GroupBy_1429081465346</name>
																			            <ID> 1429081465346</ID>
																			            <label> GroupBy_2</label>
																			            <prevPipe> Combiner_1429081436373</prevPipe>
																			           <type> GROUPBY</type>
																			            <pipeName> </pipeName>
																			            <maxPrevNode> 10</maxPrevNode>
																			            <flowName> </flowName>
																			            <inFields> KOTA,SALES_ID,HARGA</inFields>
																			            <outFields> KOTA,SALES_ID,HARGA</outFields>
																			            <inFieldsType> String,String,Double</inFieldsType>
																			            <outFieldsType> String,String,Double</outFieldsType>
																			            <posx> 749.0</posx>
																			            <posy> 196.0</posy>
																			            <tinggi> 45</tinggi>
																			            <lebar> 67</lebar>
																			            <enabled> true</enabled>
																			            <enabledCounter> true</enabledCounter>
																			            <description> </description>
																			            <groupFields> KOTA,SALES_ID</groupFields>
																			            <sortFields> </sortFields>
																			            <reverseOrder> false</reverseOrder>
																			            <groupName> </groupName>
																			            <sortOrder> </sortOrder>
																			        </Groupby>
																			        <Every>
																			            <name> Aggregator_1429081473683</name>
																			            <ID> 1429081473683</ID>
																			            <label> Aggregator_2</label>
																			            <prevPipe> GroupBy_1429081465346</prevPipe>
																			           <type> EVERY</type>
																			            <pipeName> </pipeName>
																			            <maxPrevNode> 1</maxPrevNode>
																			            <flowName> </flowName>
																			            <inFields> KOTA,SALES_ID,HARGA</inFields>
																			            <outFields> KOTA,SALES_ID,HARGA</outFields>
																			            <inFieldsType> String,String,String</inFieldsType>
																			            <outFieldsType> String,String,Double</outFieldsType>
																			            <posx> 749.0</posx>
																			            <posy> 291.0</posy>
																			            <tinggi> 45</tinggi>
																			            <lebar> 83</lebar>
																			            <enabled> true</enabled>
																			            <enabledCounter> true</enabledCounter>
																			            <description> </description>
																			            <aggregator> </aggregator>
																			            <outputSelector> </outputSelector>
																			            <assertionLevel> </assertionLevel>
																			            <assertion> </assertion>
																			            <buffer> </buffer>
																			            <argumentFieldSelector> </argumentFieldSelector>
																			            <outputAggField> HARGA</outputAggField>
																			            <groupField> KOTA,SALES_ID</groupField>
																			            <sortField> </sortField>
																			            <posxIR> 22</posxIR>
																			            <posyIR> 22</posyIR>
																			            <posxOR> 500</posxOR>
																			            <posyOR> 20</posyOR>
																			            <widhtIR> 217</widhtIR>
																			            <heightIR> 71</heightIR>
																			            <widthOR> 217</widthOR>
																			            <heightOR> 71</heightOR>
																			        </Every>
																			        <Aggregate>
																			            <parentID> 1429081473683</parentID>
																			            <ID> 1429081476407</ID>
																			            <name> cascading.solusi247.aggregator.Sum</name>
																			            <label> Sum</label>
																			            <input> HARGA</input>
																			            <output> HARGA</output>
																			            <parameter> </parameter>
																			            <posx> 333</posx>
																			            <posy> 92</posy>
																			            <conditionType> 0</conditionType>
																			            <condition> </condition>
																			        </Aggregate>
																			        <IdentityAgg>
																			            <parentID> 1429081473683</parentID>
																			            <fromField> KOTA</fromField>
																			            <toField> KOTA</toField>
																			        </IdentityAgg>
																			        <IdentityAgg>
																			            <parentID> 1429081473683</parentID>
																			            <fromField> SALES_ID</fromField>
																			            <toField> SALES_ID</toField>
																			        </IdentityAgg>
																			        <Pipe2Hfs>
																			            <fromID> 1429081473683</fromID>
																			            <toID> 1429081482250</toID>
																			        </Pipe2Hfs>
																			        <Pipe2Pipe>
																			            <fromID> 1423721977740</fromID>
																			            <toID> 1423722141538</toID>
																			            <color> black</color>
																			        </Pipe2Pipe>
																			        <Pipe2Pipe>
																			            <fromID> 1423722141538</fromID>
																			            <toID> 1429081436373</toID>
																			            <color> black</color>
																			        </Pipe2Pipe>
																			        <Pipe2Pipe>
																			            <fromID> 1429081436373</fromID>
																			            <toID> 1429081465346</toID>
																			            <color> black</color>
																			        </Pipe2Pipe>
																			        <Pipe2Pipe>
																			            <fromID> 1429081465346</fromID>
																			            <toID> 1429081473683</toID>
																			            <color> black</color>
																			        </Pipe2Pipe>
																			        <HfsSource>
																			            <fields> </fields>
																			            <path> </path>
																			            <sinkMode> </sinkMode>
																			            <label> Hfs_source_1</label>
																			             <hfsName> Hfs_source_1423721972154</hfsName>
																			            <ID> 1423721972154</ID>
																			            <type> HFSSOURCE</type>
																			            <posx> 137.0</posx>
																			            <posy> 202.0</posy>
																			            <inputdir> </inputdir>
																			            <outputdir> </outputdir>
																			            <testdir> </testdir>
																			            <tableHeader> </tableHeader>
																			            <outputWithDate>false</outputWithDate>
																			            <headerDelimited></headerDelimited>
																			            <outputFormat>hgrid247-#####</outputFormat>
																			            <fileType> Hfs</fileType>
																			            <fieldNames> </fieldNames>
																			            <enabled> true</enabled>
																			            <enabledCounter> true</enabledCounter>
																			            <argumentOrder> 0</argumentOrder>
																			            <description> </description>
																			            <schemeClass> TextLine</schemeClass>
																			            <delimiter> </delimiter>
																			            <fieldGroupPartition> </fieldGroupPartition>
																			            <incomingFields> </incomingFields>
																			            <partDelimiter> </partDelimiter>
																			            <partIndex> </partIndex>
																			            <rejectedHfs> false</rejectedHfs>
																			            <sourceFields> </sourceFields>
																			            <sinkFields> </sinkFields>
																			            <numSinkPart> </numSinkPart>
																			             <combined>false</combined>
																			             <includeFile>false</includeFile>
																			        </HfsSource>
																			        <Hfs2Pipe>
																			            <fromID> 1423721972154</fromID>
																			            <toID> 1423721977740</toID>
																			        </Hfs2Pipe>
																			        <HfsSink>
																			            <fields> </fields>
																			            <path> </path>
																			            <sinkMode> </sinkMode>
																			            <label> Hfs_sink_3</label>
																			             <hfsName> Hfs_sink_1429081482250</hfsName>
																			            <ID> 1429081482250</ID>
																			            <type> HFSSINK</type>
																			            <posx> 599.0</posx>
																			            <posy> 299.0</posy>
																			            <inputdir> </inputdir>
																			            <outputdir> </outputdir>
																			            <testdir> </testdir>
																			            <tableHeader> </tableHeader>
																			            <outputWithDate>false</outputWithDate>
																			            <headerDelimited></headerDelimited>
																			            <outputFormat>hgrid247-#####</outputFormat>
																			            <fileType> Hfs</fileType>
																			            <fieldNames> </fieldNames>
																			            <enabled> true</enabled>
																			            <enabledCounter> true</enabledCounter>
																			            <argumentOrder> 1</argumentOrder>
																			            <description> </description>
																			            <schemeClass> </schemeClass>
																			            <delimiter> </delimiter>
																			            <fieldGroupPartition> </fieldGroupPartition>
																			            <incomingFields> KOTA,SALES_ID,HARGA</incomingFields>
																			            <partDelimiter> </partDelimiter>
																			            <partIndex> </partIndex>
																			            <rejectedHfs> false</rejectedHfs>
																			            <sourceFields> </sourceFields>
																			            <sinkFields> </sinkFields>
																			            <numSinkPart> </numSinkPart>
																			        </HfsSink>
																			        <FlowProperty>
																			            <ReducerNumber> </ReducerNumber>
																			            <MapNumber> </MapNumber>
																			            <actionInputDir> L</actionInputDir>
																			            <compresstype> DefaultCodec</compresstype>
																			            <jobTrackerUrl> localhost:50030</jobTrackerUrl>
																			            <graphDisplay> false</graphDisplay>
																			            <mapOutputCompressed> false</mapOutputCompressed>
																			            <description> </description>
																			            <logPath> </logPath>
																			            <speculativeExecution> </speculativeExecution>
																			            <ingoreUnexistsPath> No</ingoreUnexistsPath>
																			            <combinedInput> false</combinedInput>
																			            <maxSplitSize> 128</maxSplitSize>
																			            <fileNdelimiter> No,|</fileNdelimiter>
																			            <reuseJVM> false</reuseJVM>
																			            <zoom> 1.0</zoom>
																			            <jobConf> </jobConf>
																			        </FlowProperty>
																			    </HGrid247>
																			"
								}
	    	response: 
					    	{
								  "err_code": 0,
								  "status": "Inventory add is succes "
								}

		- PUT projectByUser -> host:port/{apikey}/project/{project_id}/user/{user_id}
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/project/1/user/1
    	request: 
				    	{
								"project_name": "Kastowo Project2"
							}
    	response: 
				    	{
							  "err_code": 0,
							  "status": "Project have been update"
							}
		
		- PUT projectShareGroup -> host:port/{apikey}/project/{project_id}/user/{user_id}
					url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/project/1/user/1
		    	request: 
						    	{
										"project_is_share": "true"
									}
		    	response: 
						    	{
									  "err_code": 0,
									  "status": "Project have been share in group"
									}

		- DELETE 
			- Project -> host:port/{apikey}/project/{project_id}
				url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/project/1				
				response: {
								  "err_code": 0,
								  "status": "Project is deleted"
								}
			-	Inventory -> host:port/{apikey}/inventory/{inventory_id}
			url: 192.168.1.193:3001/90867b984d2a5038ee21a190996b900b/inventory/1				
			response: {
								  "err_code": 0,
								  "status": "Project is deleted"
								}
			



		