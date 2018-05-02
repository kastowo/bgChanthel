/*
 * file     historyServer.js
 * path     /app/controller/
 * purpose  controller of file directory
 * GET http://<history server http address:port>/ws/v1/history/info
 */

var config = app.get('config');

var masterkey = config.masterkey,
    common = require(app.com.common);

var showStatus = common.showStatus,
    saveLog = common.saveLog,
    verifyKey = common.verifyKey,
    stat = {};
var lib = require(app.mod.mrhistory.lib.mrhistory);

var client = require(app.com.apiclient);

var data = {
    base: {
        protocol: 'http',
        hostname: config.hadoop.default.host,
        port: config.hadoop.default.ports.history,
        pathname: 'ws/v1/history/',
    },
    path: {
        GET: {
            info: {
                location: 'info',
            },
            jobs: {
                location: 'mapreduce/jobs'
            },
            jobid: {
                location: 'mapreduce/jobs/%(jobid)s'
            },
            jobattempts: {
                location: 'mapreduce/jobs/%(jobid)s/jobattempts'
            },
            counters: {
                location: 'mapreduce/jobs/%(jobid)s/counters'
            },
            conf: {
                location: 'mapreduce/jobs/%(jobid)s/conf'
            },
            tasks: {
                location: 'mapreduce/jobs/%(jobid)s/tasks'
            },
            taskid: {
                location: 'mapreduce/jobs/%(jobid)s/tasks/%(taskid)s'
            },
            taskcounter: {
                location: 'mapreduce/jobs/%(jobid)s/tasks/%(taskid)s/counters'
            },
            taskattempts: {
                location: 'mapreduce/jobs/%(jobid)s/tasks/%(taskid)s/attempts'
            },
            taskattemptid: {
                location: 'mapreduce/jobs/%(jobid)s/tasks/%(taskid)s/attempts/%(attemptid)s'
            },
            taskattemptidcounters: {
                location: 'mapreduce/jobs/%(jobid)s/tasks/%(taskid)s/attempts/%(attemptid)s/counters'
            }
        }
    }
}

var api = new client(data);

function getStat(req, apikey) {
    return {
        start: Date.now(),
        apikey: apikey,
        request: {},
        headers: req.headers,
        ip: req.ip
    }
}

function jalan (apikey, stat, target, param, opt, res, permission) {
    verifyKey(apikey, function cekKey(sama){
        if (sama) {
            api.get(target, param, opt, function (err, response, body) {
                stat.end = Date.now();
                if (err) {
                    if (err.code == 'ECONNREFUSED') {
                        stat.end = Date.now();
                        stat.activity += ' But connection refused.';
                        saveLog(stat);
                        res.json(showStatus(5, 'Connection refused'));
                    } else {
                        stat.end = Date.now();
                        stat.activity += ' With error.';
                        saveLog(stat);
                        res.json(showStatus(9, JSON.stringify(err)));
                    }
                } else {
                    stat.end = Date.now();
                    stat.activity += ' With success.';
                    saveLog(stat);
                    res.json(JSON.parse(body));
//          res.send(body);
                }
            });
        } else {
            stat.end = Date.now();
            saveLog(stat);
            res.json(showStatus(5, 'Wrong API key'));
        }
    }, permission );
}

exports = module.exports = {
    permission: [
        'Get MR history info',
        'Get list of MR history jobs',
        'Get info of MR history job',
        'Get detail of MR history job',
        'Get MR history job tasks',
        'Get detail MR history job tasks',
    ],
    get:  {
        info: function getInfo (req, res) { // restAPI GETFILESTATUS -- Status of a File/Directory
            var apikey = req.params.apikeyid,
                stat = getStat(req, apikey);

            stat.activity = apikey + ' get map reduce history info.';
            jalan(apikey, stat, 'info', {}, {}, res, 'Get MR history info');
        },

        jobs: function getJobs (req, res) {
            var jobid = req.params.jobid,
                apikey = req.params.apikeyid,
                url = require('url'),
                stat = getStat(req, apikey);

            if (jobid) {
                var param = {
                        jobid: jobid
                    },
                    target = 'jobid',
                    opt = {},
                    permission = 'Get info of MR history job';
            } else {
                var param = {},
                    target = 'jobs',
                    opt = {
                        qs: url.parse(req.url, true).query
                    },
                    permission = 'Get list of MR history jobs';
            }

            stat.activity = apikey + ' get map reduce jobs info.';
            jalan(apikey, stat, target, param, opt, res, permission);
        },

        jobAttempts: function getJobsAttempts (req, res) {
            var apikey = req.params.apikeyid,
                stat = getStat(req, apikey),
                target = 'jobattempts',
                param = {
                    jobid: req.params.jobid
                },
                opt = {};

            stat.activity = apikey + ' get map reduce jobs attempts.';
            jalan(apikey, stat, target, param, opt, res, 'Get detail of MR history job');

        },

        jobsCounters: function getJobsCounters (req, res) { // restAPI GETFILESTATUS -- Status of a
            var apikey = req.params.apikeyid,
                stat = getStat(req, apikey),
                target = 'counters',
                param = {
                    jobid: req.params.jobid
                },
                opt = {};

            stat.activity = apikey + ' get map reduce jobs counters.';
            jalan(apikey, stat, target, param, opt, res, 'Get detail of MR history job');

        },

        jobsConf: function getJobsConf (req, res) { // restAPI GETFILESTATUS -- Status of a
            var apikey = req.params.apikeyid,
                stat = getStat(req, apikey),
                target = 'conf',
                param = {
                    jobid: req.params.jobid
                },
                opt = {};

            stat.activity = apikey + ' get map reduce jobs configuration.';
            jalan(apikey, stat, target, param, opt, res, 'Get detail of MR history job');

        },

        // CHANGES: tambahkan query type parameter dan tambahkan taskid
        jobsTasks: function getJobsTasks (req, res) { // restAPI GETFILESTATUS -- Status of a
            var apikey = req.params.apikeyid,
                jobid = req.params.jobid,
                taskid = req.params.taskid,
                url = require('url');

            if (taskid) {
                var target = 'taskid',
                    param = {
                        jobid: jobid,
                        taskid: taskid
                    },
                    opt = {}
            } else {
                var target = 'tasks',
                    param = {
                        jobid: jobid
                    },
                    opt = {
                        qs: url.parse(req.url, true).query
                    }
            }

            stat.activity = apikey + ' get map reduce jobs configuration.';
            jalan(apikey, stat, target, param, opt, res, 'Get MR history job tasks');

        },

        // CHANGES: lebih ramping
        jobsTasksCounters: function getJobsTasksCounters (req, res) { // restAPI GETFILESTATUS -- Status of a
            var apikey = req.params.apikeyid,
                stat = getStat(req, apikey),
                target = 'taskcounter',
                param = {
                    jobid: req.params.jobid,
                    taskid: req.params.taskid
                },
                opt = {};

            stat.activity = apikey + ' get map reduce jobs task counter.';
            jalan(apikey, stat, target, param, opt, res, 'Get detail MR history job tasks');

        },

        // CHANGES: lebih ramping
        jobsTasksAttempts: function getJobsTasksAttempts (req, res) { // restAPI GETFILESTATUS -- Status of a
            var apikey = req.params.apikeyid,
                jobid = req.params.jobid,
                taskid = req.params.taskid,
                attemptid = req.params.attemptid;

            if (attemptid) {
                var target = 'taskattemptid',
                    param = {
                        jobid: jobid,
                        taskid: taskid,
                        attemptid: attemptid
                    };
            } else {
                var target = 'taskattempts',
                    param = {
                        jobid: jobid,
                        taskid: taskid
                    };
            }

            stat.activity = apikey + ' get map reduce jobs task attempts.';
            jalan(apikey, stat, target, param, {}, res, 'Get detail MR history job tasks');

        },

        // CHANGES: lebih ramping
        jobsTasksAttemptsCounters: function getJobsTasksAttemptCounters (req, res) { // restAPI GETFILESTATUS -- Status of a
            var apikey = req.params.apikeyid,
                stat = getStat(req, apikey),
                target = 'taskattemptidcounters',
                param = {
                    jobid: req.params.jobid,
                    taskid: req.params.taskid,
                    attemptid: req.params.attemptid
                };

            stat.activity = apikey + ' get map reduce jobs task attempts.';
            jalan(apikey, stat, target, param, {}, res, 'Get detail MR history job tasks');

        }
    }
}