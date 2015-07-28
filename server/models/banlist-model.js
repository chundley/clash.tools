/*
*   CRUD API for the ban list
*/

var ObjectID = require('mongodb').ObjectID,
    _        = require('underscore');

var config = require('../../config/config');

/*
* Saves a record and returns the resulting record
*/
exports.save = function(model, callback) {
    if (_.isString(model.clan_id)) {
        model.clan_id = new ObjectID.createFromHexString(model.clan_id);
    }

    if (_.isString(model.note.user_id)) {
        model.note.user_id = new ObjectID.createFromHexString(model.note.user_id);
    }

    model.created_at = new Date();

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'ban_list', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.save(model, function (err, result) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, model);
                }
            });
        }
    });
}

exports.get = function(clanId, callback) {

    if (_.isString(clanId)) {
        clanId = new ObjectID.createFromHexString(clanId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'ban_list', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find(
                {
                    clan_id: clanId
                },
                {} )
                .sort({ign: 1}).toArray(function (err, items) {
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

exports.getByUserId = function(clanId, userId, callback) {

    if (_.isString(clanId)) {
        clanId = new ObjectID.createFromHexString(clanId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'ban_list', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { clan_id: clanId, user_id: userId }, function (err, item) {
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

exports.delete = function(clanId, userId, callback) {
    if (_.isString(clanId)) {
        clanId = new ObjectID.createFromHexString(clanId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'ban_list', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.remove( { clan_id: clanId, user_id: userId }, function (err, results) {
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
