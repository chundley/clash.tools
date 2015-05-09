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

    _.each(message.to_users, function (user) {
        if (_.isString(user.user_id)) {
            user.user_id = new ObjectID.createFromHexString(user.user_id);
        }
    });

    message.created_at = new Date();
    
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
                        //{ 'to_user.user_id': userId }
                        { to_users: { $elemMatch: { user_id: userId } } }
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

exports.getById = function(messageId, callback) {
    if (_.isString(messageId)) {
        messageId = new ObjectID.createFromHexString(messageId);
    }
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_message', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { _id: messageId }, function (err, item) {
                if (err) {
                    callback(err, null);
                }
                else if (item) {
                    callback(null, item);
                }
                else {
                    callback(null, null);
                }
            });
        }
    });
}

/*
*   Used to update a simple name/value pair field, like "read" and "deleted"
*/
/*exports.updateField = function(emailMessageId, field, value, callback) {
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
}*/

/*
*   Sets an email to "deleted" puts in trash folder
*/
exports.deleteEmail = function(emailMessageId, userId, callback) {
    if (_.isString(emailMessageId)) {
        emailMessageId = new ObjectID.createFromHexString(emailMessageId);
    }
    if (_.isString(userId)) {
        userId = new ObjectID.createFromHexString(userId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_message', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            // delete message "to" users (deleting from inbox)
            collection.update(
                { _id: emailMessageId, 'to_users.user_id': userId },
                { $set: { 'to_users.$.deleted': true} },
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

            // delete message "from" users (deleting from sent mail)
            collection.update(
                { _id: emailMessageId, 'from_user.user_id': userId },
                { $set: { 'from_user.deleted': true} },
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

/*
*   Sets an email to "read"
*/
exports.setRead = function(emailMessageId, userId, callback) {
    if (_.isString(emailMessageId)) {
        emailMessageId = new ObjectID.createFromHexString(emailMessageId);
    }
    if (_.isString(userId)) {
        userId = new ObjectID.createFromHexString(userId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_message', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.update(
                { _id: emailMessageId, 'to_users.user_id': userId },
                { $set: { 'to_users.$.read': true} },
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

/*
*   Gets a count of new emails for the top nav interface
*/
exports.countNew = function(userId, callback) {
    if (_.isString(userId)) {
        userId = new ObjectID.createFromHexString(userId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_message', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {  
            collection.find( { 'to_users.user_id': userId, 
                               'to_users.read': false, 
                               'to_users.deleted': false } 
                            ).count(function (err, count) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, count);
                }
            });                  
        }
    });
}