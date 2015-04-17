
var mongodb = require('mongodb');
    _       = require('underscore');

var config = require('../../config/config');

var mongoCache = function() {

    // keep open connections cached
    var dbs = {};

    // replica set config
    var servers = [];
    _.each(config.env[process.env.NODE_ENV].mongoDb.servers, function (server) {
        servers.push(new mongodb.Server(server.host, server.port, { auto_reconnect: true} ));
    });
    var replSet = new mongodb.ReplSetServers(servers);

    var ensureDB = function(dbName, callback) {
        if (dbs[dbName]) {
            callback(null, dbs[dbName]);
            return;
        }

        // Set up database connection with the following options:
        //    - replica set for failover
        //    - write preference of 1 = get ack from the primary that the operation was accepted
        //    - read preference of primary preferred, will read from secondary during a failover
        var db = new mongodb.Db(dbName, replSet, { w: 1, readPreference: mongodb.ReadPreference.PRIMARY_PREFERRED } );

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
