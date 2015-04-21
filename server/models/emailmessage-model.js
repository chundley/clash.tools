/*
*   CRUD API for Email messages
*/

var ObjectID = require('mongodb').ObjectID,
    _        = require('underscore');

var config = require('../../config/config');

/*
* Saves a record and returns the resulting record
*/
exports.save = function(message, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_message', function (err, collection) {
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

exports.get = function(userId, count, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_message', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find(
                {
                    account_id: accountId,
                    dismissed: { $nin: [userId] }
                },
                {} )
                .sort({created_at: -1}).toArray(function (err, items) {
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

/*
*   Used to update a simple name/value pair field, like "read" and "deleted"
*/
exports.updateField = function(emailMessageId, field, value, callback) {
    if (_.isString(emailMessageId)) {
        emailMessageId = new ObjectID.createFromHexString(emailMessageId);
    }
    var update = { field: value };
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_message', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.update(
                { _id: emailMessageId },
                { $set: update },
                { upsert: false },
                function (err, doc) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        callback(null, doc);
                    }
                }
            );
        }
    });
}
