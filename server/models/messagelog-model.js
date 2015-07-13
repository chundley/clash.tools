/*
*   CRUD API for Message logging
*/

var ObjectID = require('mongodb').ObjectID;

var config = require('../../config/config');

/*
* Saves a record and returns the resulting record
*/
exports.save = function(message, callback) {
    message.created_at = new Date();
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'message_log', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.save(message, function (err, result) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, result);
                }
            });
        }
    });
}

exports.get = function(clanId, count, callback) {
    count = parseInt(count);
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'message_log', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find(
                {
                    clan_id: clanId
                },
                {} )
                .limit(count)
                .sort({created_at: -1}).toArray(function (err, items) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (items) {
                        callback(null, items);
                    }
                    else {
                        callback(null, null);
                    }
                }
            });
        }
    });
}

/*
*   Purges messages that are older than X days
*/
exports.purge = function(numDays, callback) {
    var now = new Date();
    var purgeDate = new Date(now.getTime() - (numDays * 24 * 60 * 60 * 1000));

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'message_log', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.remove( { created_at: { $lt: purgeDate } }, function (err, results) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, results.result.n);
                }
            });
        }
    });    
}
