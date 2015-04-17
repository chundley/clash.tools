/*
*   CRUD API for error messages
*/

var ObjectID = require('mongodb').ObjectID;

var config = require('../../config/config');

/*
* Upserts a record and returns the resulting record
*/
exports.saveError = function(error, callback) {
    error.created_at = new Date();

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'error_log', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.save(error, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err, null);
                }
                else {
                    callback(null, result);
                }
            });
        }
    });
}

/*
*   Gets errors created in the last n hours
*/
exports.opsErrors = function(hours, callback) {
    var now = new Date();
    now.setTime(now.getTime() - (hours*60*60*1000));

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'error_log', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find( { created_at: { $gte: now } }, {} ).sort({created_at: -1}).toArray(function (err, items) {
                if (err) {
                    logger.error(err);
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