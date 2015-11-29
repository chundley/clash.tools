/*
*   CRUD API for Message logging
*/

var ObjectID = require('mongodb').ObjectID,
    _        = require('underscore');


/*
* Saves a record and returns the resulting record
*/
exports.save = function(note, callback) {

    if (_.isString(note.user_id)) {
        note.user_id = new ObjectID.createFromHexString(note.user_id);
    }

    if (_.isString(note.clan_id)) {
        note.clan_id = new ObjectID.createFromHexString(note.clan_id);
    }

    if (_.isString(note.note.user_id)) {
        note.note.user_id = new ObjectID.createFromHexString(note.note.user_id);
    }

    note.created_at = new Date();

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'player_notes', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.save(note, function (err, result) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, note);
                }
            });
        }
    });
}

exports.get = function(userId, clanId, callback) {
    if (_.isString(userId)) {
        userId = new ObjectID.createFromHexString(userId);
    }

    if (_.isString(clanId)) {
        clanId = new ObjectID.createFromHexString(clanId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'player_notes', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find(
                {
                    user_id: userId,
                    clan_id: clanId
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

exports.delete = function(noteId, callback) {
    if (_.isString(noteId)) {
        noteId = new ObjectID.createFromHexString(noteId);
    }
    
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'player_notes', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.remove( { _id: noteId }, function (err, results) {
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
