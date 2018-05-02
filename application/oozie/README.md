1. Oozie
-----------------------------------------------------------------------  POST  -----------------------------------------------------------------------------
  - POST submitJob -> host:port/{apikey}/submit_job (MENGIRIM JOB KE OOZIE BESERTA PARAMETER2 YG DIBUTUHKAN)
    apikey : mandatory (yes)

    url : 192.168.1.231:2007/90867b984d2a5038ee21a190996b900b/submit_job
    request : (di body nya)
    {
      "projectId":"2",
      "jarName" : "/user/yava/ANANG/testoozie/hgrid.jar",
      "jobName" : "hgridCoor",
      "className" : "hgrid.hgird1",
      "args" : {
                   "input":"/user/yava/ANANG/testoozie/hgrid/input-data/dummy_1",
                   "output":"/user/yava/ANANG/testoozie/hgrid/output-data/hgrid"
               }
    }

    NOTE : untuk args lebih dari satu, pemisah antar argumen dengan kode : , supaya bisa dinamis

    response :
    {
        err_code: 0,
        data:{
            id:'0000067-170118151427324-oozie-oozi-W',
            status:'RUNNING'
        }
    }



  - POST getxml -> host:port/{apikey}/get_xml (MENDAPATKAN HASIL GENERATE XML DAN WORKFLOW SAJA DARI INPUT USER JUGA)
    apikey : mandatory (yes)

    url : 192.168.1.231:2007/90867b984d2a5038ee21a190996b900b/get_xml
    request body :
    {
      "projectId":"2",
      "jarName" : "/user/yava/ANANG/testoozie/hgrid.jar",
      "jobName" : "hgridCoor",
      "className" : "hgrid.hgird1",
       "args" : {
                    "input":"/user/yava/ANANG/testoozie/hgrid/input-data/dummy_1",
                    "output":"/user/yava/ANANG/testoozie/hgrid/output-data/hgrid"
                }
    }

    *CATATAN!
    jika ada "args" lain, cukup tambahkan key other dan value-nya; jika lebih dari satu, cukup dipisah dengan ',' (koma) value-nya.
    CONTOH:

    request body :
    {
      "projectId":"2",
      "jarName" : "/user/yava/ANANG/testoozie/hgrid.jar",
      "jobName" : "hgridCoor",
      "className" : "hgrid.hgird1",
       "args" : {
                    "input":"/user/yava/ANANG/testoozie/hgrid/input-data/dummy_1,/user/yava/ANANG/testlain",
                    "output":"/user/yava/ANANG/testoozie/hgrid/output-data/hgrid",
                    "others":"/user/direktorilain,/user/direktorilainlagi,/dll"
                }
    }

    response :

-------------------------------------------------------------------------  GET  --------------------------------------------------------------------------------------

  - GET getJobHistory -> host:port/{apikey}/get_job_history/project/{project_id} (MENDAPATKAN JOB ID OOZIE DARI DATABASE UNTUK USER TERTENTU)
    apikey : mandatory (yes)
    project_id : mandatory (yes)

    url : 192.168.1.231:2007/90867b984d2a5038ee21a190996b900b/get_job_history/project/2
    response :



  - GET getJobId -> host:port/{apikey}/get_job_id (MENDAPATKAN JOB ID OOZIE DARI DATABASE UNTUK USER TERTENTU)
    apikey : mandatory (yes)

    url : 192.168.1.231:2007/90867b984d2a5038ee21a190996b900b/get_job_id
    response :



  - GET getJobInfo -> host:port/{apikey}/get_job_info/{ooziejob_id} (MENDAPATKAN DETAIL JOB DARI OOZIE SEKALIGUS UPDATE STATUS JOB KE DB)
    apikey : mandatory (yes)
    ooziejob_id : mandatory (yes)

    url : 192.168.1.231:2007/90867b984d2a5038ee21a190996b900b/get_job_info/0000067-170118151427324-oozie-oozi-W
    response :






------------------------------------------------
PR :
  tambah rest untuk ambil informasi lengkap dari job sbg informasi history
  coba pake jar lain, dengan config yang baru (input lagi ke db)
