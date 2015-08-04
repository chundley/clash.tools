/*
*   CRUD API for Clans
*/

var ObjectID = require('mongodb').ObjectID,
    async    = require('async'),
    _        = require('underscore');

var config            = require('../../config/config');
    //clanModel         = require('./clan-model'),
    //attackResultModel = require('./attackresult-model');


/*
*   Create a new arranged match
*/
exports.newMatch = function(metaData, callback) {
    if (_.isString(metaData.clan_1.clan_id)) {
        metaData.clan_1.clan_id = new ObjectID.createFromHexString(metaData.clan_1.clan_id);
    }

    if (_.isString(metaData.clan_2.clan_id)) {
        metaData.clan_2.clan_id = new ObjectID.createFromHexString(metaData.clan_2.clan_id);
    }

    var match = {
        roster_count: 10,
        clan_1: metaData.clan_1,
        clan_2: metaData.clan_2,
        created_at: new Date()
    };

    match.clan_1.roster = [];
    match.clan_2.roster = [];

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'matchup', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.save(match, function (err, results) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, results);
                }
            });
        }
    });
}

/*
* Upserts a record and returns the record
*/
exports.save = function(model, callback) {

    if (model._id && _.isString(model._id)) {
        model._id = new ObjectID.createFromHexString(model._id);
    }

    if (_.isString(model.clan_id)) {
        model.clan_id = new ObjectID.createFromHexString(model.clan_id);
    }

    if (_.isString(model.created_by)) {
        model.created_by = new ObjectID.createFromHexString(model.created_by);
    }

    model.last_updated_at = new Date();

    if (model.created_at) {
        model.created_at = new Date(model.created_at);
    }
    else {
        model.created_at = model.last_updated_at;
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'war', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.save(model, function (err, results) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (results.result.ok == 1) { // successful update
                        callback(null, model);
                    }
                    else {  // successful save new
                        callback(null, results);
                    }
                }
            });
        }
    });

}

exports.delete = function(warId, callback) {
    if (_.isString(warId)) {
        warId = new ObjectID.createFromHexString(warId);
    }

    async.waterfall([
        function (callback_w) {
            // delete attack results
            attackResultModel.deleteWar(warId, function (err, count) {
                if (err) {
                    callback_w(err, null);
                }
                else {
                    callback_w(null, count);
                }
            });
        },
        function (count, callback_w) {
            // delete the war
            db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'war', function (err, collection) {
                if (err) {
                    callback_w(err, null);
                }
                else {
                    collection.remove( { _id: warId }, function (err, count) {
                        if (err) {
                            callback_w(err, null);
                        }
                        else {
                            callback_w(null, count);
                        }
                    });
                }
            });
        }
    ], function (err, results) {
        if (err) {
            callback(err, null)
        }
        else {
            callback(null, results);
        }
    });
}



