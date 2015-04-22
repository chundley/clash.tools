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
    if (_.isString(message.from_user.user_id)) {
        message.from_user.user_id = new ObjectID.createFromHexString(message.from_user.user_id);
    }
    if (_.isString(message.to_user.user_id)) {
        message.to_user.user_id = new ObjectID.createFromHexString(message.to_user.user_id);
    }

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
    if (_.isString(userId)) {
        userId = new ObjectID.createFromHexString(userId);
    }
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_message', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find(
                {
                    $or: [
                        { 'from_user.user_id': userId },
                        { 'to_user.user_id': userId }
                    ]
                },
                {} )
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
*   Used to update a simple name/value pair field, like "read" and "deleted"
*/
exports.updateField = function(emailMessageId, field, value, callback) {
    if (_.isString(emailMessageId)) {
        emailMessageId = new ObjectID.createFromHexString(emailMessageId);
    }
    var update = {};
    update[field] = value;

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
