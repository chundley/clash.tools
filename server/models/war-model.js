/*
*   CRUD API for Clans
*/

var ObjectID = require('mongodb').ObjectID,
    async    = require('async'),
    _        = require('underscore');

var config    = require('../../config/config');


/*
*   Get active war by clan id
*
*   Only one war can be active at once
*/
exports.activeWar = function(clanId, callback) {
    if (_.isString(clanId)) {
        clanId = new ObjectID.createFromHexString(clanId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'war', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { clan_id: clanId, active: true }, function (err, war) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, war);
                }
            });
        }
    });    
}


/*
* Upserts a record and returns the resulting record
*/
/*exports.save = function(model, callback) {
    var me = this;
    var newClan = false;
    async.waterfall([
        function (callback_wf) {
            if (!model._id) {
                me.findByTag(model.clan_tag, function (err, record) {
                    if (err) {
                        callback_wf(err, null);
                    }
                    else if (record) {
                        callback_wf('Clan already exists', record);
                    }
                    else {
                        newClan = true;
                        callback_wf(null, null);
                    }
                });
            }
            else {
                callback_wf(null, null);
            }
        },
        function (clan, callback_wf) {
            if (clan) {
                // attempting to save a new clan, clan tag already exists
                logger.error('we should never see this message');
                callback_wf('Clan already exists', clan);
            }
            else {  // everything is good, save clan (new or existing)
                // sometimes id is native, sometimes it's been converted to a string
                if (model._id && _.isString(model._id)) {
                    model._id = new ObjectID.createFromHexString(model._id);
                }

                if (_.isString(model.created_by)) {
                    model.created_by = new ObjectID.createFromHexString(model.created_by);
                }

                // clan is safe to save
                model.last_updated_at = new Date();

                if (!model.created_at) {
                    model.created_at = model.last_updated_at;
                }
                else {
                    model.created_at = new Date(model.created_at);
                }

                db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'clan', function (err, collection) {
                    if (err) {
                        callback_wf(err, null);
                    }
                    else {
                        collection.save(model, function (err, result) {
                            if (err) {
                                callback_wf(err, null);
                            }
                            else {
                                if (result == 1) {
                                    // result is 1 if the record existed and was updated
                                    callback_wf(null, model);
                                }
                                else {
                                    // record was inserted, send back the new object that includes the _id field
                                    callback_wf(null, result);
                                }
                            }
                        });
                    }
                });
            }
        }
    ], function (err, result) {
        if (err && !result) {       // an error happened
            callback(err, null);
        }
        else if (err && result) {   // tried to save a duplicate
            callback(err, result);
        }
        else {                      // save successful
            if (newClan) {
                // in the case of a new clan, we need to update the user model to reflect joining the new clan (and leader)
                userModel.updateClan(result.created_by, result, true, function (err, user) {
                    if (err) {
                        // this should never hapen
                        callback(err, null);
                    }
                    else {
                        callback(null, result);
                    }
                });
            }
            else {
                callback(null, result);
            }
        }
    });
}*/

/*
*   Get metadata for all clans
*/
/*exports.allClans = function(query, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'clan', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            var q = {};
            if (query !== '*') {
                q.$or = [
                    { name: { $regex: query, $options: 'i'} },
                    { clan_tag: { $regex: query, $options: 'i'} }
                ];
            }

            collection.find( q, {} ).sort({name: 1}).limit(50).toArray(function (err, clans) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (clans) {
                        async.each(clans, function (clan, callback_a) {
                            clanMetrics(clan._id, function (err, metrics) {
                                if (err) {
                                    callback_a(err);
                                }
                                else {
                                    clan.metrics = metrics;
                                    callback_a(null)
                                }
                            });
                        }, function (err) {
                            if (err) {
                                callback(err, null);
                            }
                            else {
                                callback(null, clans);
                            }
                        });
                    }
                    else {
                        callback(null, null);
                    }
                }
            });
        }
    });
}*/

/*
*   Find war by id
*/
exports.findById = function(id, callback) {
    if (_.isString(id)) {
        id = new ObjectID.createFromHexString(id);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'war', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { _id: id }, function (err, item) {
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