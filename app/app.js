
/*
 * Third-party packages
*/
var async       = require('async'),
    express     = require('express'),
    log4js      = require('log4js'),
    mongoClient = require('mongodb').MongoClient,
    passport    = require('passport'),
    _           = require('underscore');

/*
 * Local packages
*/
var config       = require('../config/config'),
    User         = require('../server/models/user-model'),
    util         = require('./shared/util');

/*
* Local variables
*/
var instance;

App = function() {
    var theApp, db;
    if (!instance) {
        instance = this;
        theApp = express();

        theApp.configure(function() {
            theApp.use(express.cookieParser('secret'));
            theApp.use(log4js.connectLogger(logger));
            theApp.use(express.bodyParser());
            theApp.use(express.cookieSession(
                {
                    secret: config.env[process.env.NODE_ENV].cookieSecret
                }));

            theApp.use(passport.initialize());
            theApp.use(passport.session());

            passport.use(User.localStrategy);
            passport.serializeUser(User.serializeUser);
            passport.deserializeUser(User.deserializeUser);

            // log Api usage only
            //appSSL.use('/v1/', util.logApiUsage());
            theApp.use('/v1/', function (req, res, next) {
                res.setHeader('Access-Control-Allow-Origin', config.env[process.env.NODE_ENV].wwwSite);
                res.setHeader('Access-Control-Allow-Methods', 'GET');

                next();
            });

            // web app
            theApp.use('/', express.static(__dirname + '/public'));
            theApp.use('/vendor/css', express.static(__dirname + '/public/vendor/css'));
            theApp.use('/vendor/font', express.static(__dirname + '/public/vendor/font'));
            theApp.use('/vendor/js', express.static(__dirname + '/public/vendor/js'));

            // for angular-ui bootstrap control replacements
            theApp.use('/template', express.static(__dirname + '/public/vendor/js/template'));

            // general error handling
            theApp.use(function(err, req, res, next) {
                res.json(500, {error: err});
            });
        });
    }

    _.extend(instance, {
        theApp: function () { return theApp; },
    });

    return instance;
}

App.prototype.init = function(callback) {
    var self = this;
    async.parallel(
    [
        function (callback_inner) {
            // attempt a connection to MongoDB and warn if none is available
            db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
                if (err) {
                    logger.warn('MongoDB connection failed: ' + err);
                    callback_inner();
                }
                else {
                    logger.info('Connected to MongoDB');
                    callback_inner();
                }
            });
        }
    ],
    function (err, results) {
        callback(err);
    });
}

module.exports = App;
