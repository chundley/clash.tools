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

/*exports.dismiss = function(userId, messageId, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'message_log', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.update(
                { _id: ObjectID.createFromHexString(messageId) },
                { $push: { dismissed: userId } },
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
}*/
