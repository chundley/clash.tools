/*
*   CRUD API for Accounts
*/

var ObjectID = require('mongodb').ObjectID,
    _        = require('underscore');

var config = require('../../config/config'),
    user   = require('./user-model'),
    mailModel = require('./mail-model');

/*
* Upserts a record and returns the resulting record
*/
exports.saveModel = function(model, callback) {

    // sometimes id is native, sometimes it's been converted to a string
    if (model._id && _.isString(model._id)) {
        model._id = new ObjectID.createFromHexString(model._id);
    }

    checkReplyTo(model, function (err, found) {
        if (err) {
            callback(err, null);
        }
        else if (found) {
            callback('Address in use', null);
        }
        else {
            // account is safe to save
            model.last_updated_at = new Date();

            if (!model.created_at) {
                model.created_at = model.last_updated_at;
            }
            else {
                model.created_at = new Date(model.created_at);
            }

            db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'account', function (err, collection) {
                if (err) {
                    callback(err, null);
                }
                else {
                    collection.save(model, function (err, result) {
                        if (err) {
                            callback(err, null);
                        }
                        else {
                            if (result == 1) {
                                // result is 1 if the record existed and was updated
                                callback(null, model);
                            }
                            else {
                                // record was inserted, send back the new object that includes the _id field
                                callback(null, result);
                            }
                        }
                    });
                }
            });
        }
    });
}

/*
*   Find Account by id
*/
exports.findById = function(id, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'account', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { _id: ObjectID.createFromHexString(id) }, function (err, item) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, item);
                }
            });
        }
    });
}


/*
*   Find Account by user id
*/
exports.findByUserId = function(id, callback) {
    // first find the user
    user.findById(id, function (err, user) {
        if (err) {
            callback(err, null);
        }
        else {
            db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'account', function (err, collection) {
                if (err) {
                    callback(err, null);
                }
                else {
                    collection.findOne( { _id: ObjectID.createFromHexString(user.account_id) }, function (err, item) {
                        if (err) {
                            callback(err, null);
                        }
                        else {
                            callback(null, item);
                        }
                    });
                }
            });
        }

    });
}

/*
*   Get all accounts for admin view
*/
exports.adminAllAccounts = function(callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'account', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find( {}, {} ).sort({created_at: -1}).toArray(function (err, items) {
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
*   Internal function to check the reply-to address and ensure uniqueness
*       Returns true if the address is already in use, false otherwise
*/
function checkReplyTo(model, callback) {
    if (!model._id || model.reply_domain.length == 0) {
        // this is a new account, or an account that has a blank reply_domain
        callback(null, false);
    }
    else {
        db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'account', function (err, collection) {
            if (err) {
                callback(err, null);
            }
            else {
                collection.findOne( { _id: { $ne: model._id }, reply_domain: model.reply_domain }, function (err, item) {
                    if (err) {
                        callback(err, null);
                    }
                    else if (item) {
                        callback(null, true);
                    }
                    else {
                        callback(null, false);
                    }
                });
            }
        });
    }
}

/*
*   Set a field value in the account record
*/
exports.setField = function(accountId, field, value, callback) {

    if (_.isString(accountId)) {
        accountId = new ObjectID.createFromHexString(accountId);
    }

    // create the field value to be updated
    var update = {};
    update[field] = value;

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'account', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.update(
                { _id: accountId },
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