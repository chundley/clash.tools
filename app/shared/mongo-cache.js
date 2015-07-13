
var mongodb = require('mongodb'),
    _       = require('underscore');

/*var Server  = mongodb.Server,
    ReplSet = mongodb.ReplSet;*/


var config = require('../../config/config');



// This logging stuff didn't work

/*var mongoLogger = {};
mongoLogger.doDebug = true;

mongoLogger.error = function(message, object) {
    logger.error(message);
}

mongoLogger.log = function(message, object) {
    logger.info(message);
}

mongoLogger.debug = function(message, object) {
    logger.debug(message);
}*/


var mongoCache = function() {

    // keep open connections cached
    var dbs = {};

/*

    Commenting out replica set code since this database isn't replicated yet

    // replica set config
    var servers = [];
    _.each(config.env[process.env.NODE_ENV].mongoDb.servers, function (server) {
        servers.push(new mongodb.Server(server.host, parseInt(server.port), { auto_reconnect: true} ));
    });

    //logger.warn(servers[0].s);
    var replSet = new mongodb.ReplSet(servers);*/



    // in lieu of replica set
    var server = new mongodb.Server(config.env[process.env.NODE_ENV].mongoDb.servers[0].host, parseInt(config.env[process.env.NODE_ENV].mongoDb.servers[0].port), { auto_reconnect: true} );


    var ensureDB = function(dbName, callback) {
        if (dbs[dbName]) {
            callback(null, dbs[dbName]);
            return;
        }

        // Set up database connection with the following options:
        //    - replica set for failover
        //    - write preference of 1 = get ack from the primary that the operation was accepted
        //    - read preference of primary preferred, will read from secondary during a failover
        
        // replica set db
        //var db = new mongodb.Db(dbName, replSet, { w: 1, readPreference: mongodb.ReadPreference.PRIMARY_PREFERRED, fsync: true } );

        // single server version
        var db = new mongodb.Db(dbName, server, { w: 1, fsync: true } );


        db.open(function (err, connection) {
            if (err) {
                callback(err, null);
                return;
            }

            db.authenticate(config.env[process.env.NODE_ENV].mongoDb.user, config.env[process.env.NODE_ENV].mongoDb.pwd, function (err, db) {
                if (err) {
                    callback(err, null);
                    return;
                }

                dbs[dbName] = connection;
                connection.on('close', function() {
                    delete(dbs[dbName]);
                });

                callback(null, connection);
            });

        });

    }

    var ensureCollection = function(dbName, collectionName, callback) {

        ensureDB(dbName, function (err, connection) {
            if (err) {
                callback(err, null);
                return;
            }

            connection.createCollection(collectionName, function (err, collection) {
                if (err) {
                    callback(err, null);
                    return;
                }

                callback(null, collection);
            });
        });
    }

    return ensureCollection;
}

module.exports = mongoCache;
