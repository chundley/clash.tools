// # clash.tools application startup

// if no env is set, default to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/*
 * Third-party packages
*/
var http    = require('http'),
    https   = require('https'),
    fs      = require('fs'),
    io      = require('socket.io'),
    log4js  = require('log4js'),
    cronJob = require('cron').CronJob;

/*
 * Module dependencies
*/
var config          = require('./config/config'),
    mongoCache      = require('./app/shared/mongo-cache'),
    App             = require('./app/app'),
    warModel        = require('./server/models/war-model'),
    purgeEmail      = require('./server/jobs/emailmessagepurge-job'),
    purgeMessagelog = require('./server/jobs/messagelogpurge-job');

/*
 * Global logger
*/
log4js.configure('./config/log4jsconfig.json', {
    cwd: __dirname
});

logger = log4js.getLogger('file-logger')
logger.setLevel(config.env[process.env.NODE_ENV].logLevel);

/*
* Global connection manager for MongoDB
*/
db = mongoCache();


/*
*   Purge email messages
*/
var purgingEmail = false;
var purgeEmailJob = new cronJob(config.env[process.env.NODE_ENV].jobSchedule.purgeEmailJob, function() {
    try {
        if (!purgingEmail) {
            purgingEmail = true;
            logger.info('Purge email job starting...');
            var start = new Date();
            purgeEmail.runJob(config.env[process.env.NODE_ENV].purgeDays.purgeEmail, function() {
                purgingEmail = false;
            });
        }
    } catch(err) {
       logger.error(err);
   }
});
purgeEmailJob.start();

/*
*   Purge message log
*/
var purgingMessagelog = false;
var purgeMessagelogJob = new cronJob(config.env[process.env.NODE_ENV].jobSchedule.purgeMessagelogJob, function() {
    try {
        if (!purgingMessagelog) {
            purgingMessagelog = true;
            logger.info('Purge message log job starting...');
            var start = new Date();
            purgeMessagelog.runJob(config.env[process.env.NODE_ENV].purgeDays.purgeMessagelog, function() {
                purgingMessagelog = false;
            });
        }
    } catch(err) {
       logger.error(err);
   }
});
purgeMessagelogJob.start();

/*
 * The app
*/
var app = new App();

app.init(function(err) {
    if (err) {
        logger.error('Failed to initialize Siftrock');
        return;
    }

    // all routes configured in routes.js
    require('./server/routes.js')(app.theApp());

    // fire it up
    var server = http.createServer(app.theApp());

    // global socket object
    socket = io.listen(server);

    server.listen(
        config.env[process.env.NODE_ENV].url.port,
        config.env[process.env.NODE_ENV].url.host,
        function() {
            logger.info('Server listening on ' +
                config.env[process.env.NODE_ENV].url.host + ':'
                + config.env[process.env.NODE_ENV].url.port);

            /*
            *   Used for backfilling attack results after a change to the scoring algorythm
            *
            *   Un-comment this line to run the backfill once on startup
            */

            //warModel.backfillAllWars(function(err, result){ logger.info('Attack result backfill finished')});
        }
    );
});
