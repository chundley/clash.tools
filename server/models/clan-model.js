/*
*   CRUD API for Clans
*/

var ObjectID = require('mongodb').ObjectID,
    async    = require('async'),
    _        = require('underscore');

var config    = require('../../config/config'),
    userModel = require('./user-model'),
    warModel  = require('./war-model');

/*
* Upserts a record and returns the resulting record
*/
exports.save = function(model, callback) {
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
                                if (result.result.ok == 1) {
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
}

/*
*   Get metadata for all clans
*/
exports.allClans = function(query, count, callback) {
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

            count = parseInt(count);

            collection.find( q, { _id: 1, name: 1, clan_tag: 1 } ).sort({name: 1}).limit(count).toArray(function (err, clans) {
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
}

/*
*   Find Clan by id
*/
exports.findById = function(id, callback) {
    if (_.isString(id)) {
        id = new ObjectID.createFromHexString(id);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'clan', function (err, collection) {
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

/*
*   Find Clan by clan tag
*/
exports.findByTag = function(tag, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'clan', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { clan_tag: tag }, function (err, item) {
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
*   Gets the clan roster detail
*
*   This pulls all members who've ever warred with the clan and their results
*/
exports.getRoster = function(clanId, callback) {
    if (_.isString(clanId)) {
        clanId = new ObjectID.createFromHexString(clanId);
    }

    var roster = {};

    warModel.getFullHistory(clanId, function (err, wars) {
        if (err) {
            callback(err, null);
        }
        else {
            _.each(wars, function (war) {
                _.each(war.bases, function (base) {
                    _.each(base.a, function (assignment) {
                        if (!roster[assignment.u]) {
                            var member = {
                                u: assignment.u,
                                i: assignment.i,
                                r: {
                                    3: 0,
                                    2: 0,
                                    1: 0,
                                    0: 0
                                }
                            };

                            roster[assignment.u] = member;
                        }
                        else {
                            if (assignment.s != null) {
                                roster[assignment.u].r[assignment.s]++;
                            }
                            else {
                                roster[assignment.u].r[0]++;
                            }
                        }
                    });
                });
            });
            logger.warn(roster);
            callback(null, roster);
        }
    });
}

/*
*   Get metadata for all clans (super admin view)
*/
exports.adminAllClans = function(query, count, callback) {
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

            count = parseInt(count);

            collection.find( q, { _id: 1, name: 1, clan_tag: 1, created_at: 1 } ).sort({name: 1}).limit(count).toArray(function (err, clans) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (clans) {
                        async.each(clans, function (clan, callback_a) {
                            adminClanMetrics(clan._id, function (err, metrics) {
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
}

/*
*   Get ALL meta data for a clan
*/
exports.adminAllData = function(clanId, callback) {
    var clan = {};

    async.parallel({
        clanBase: function(callback_p) {
            exports.findById(clanId, function (err, c) {
                if (err) {
                    callback_p(err, null);
                }
                else {
                    callback_p(null, c);
                }
            });
        },
        members: function(callback_p) {
            userModel.usersByClan(clanId, [], function (err, u) {
                if (err) {
                    callback_p(err, null);
                }
                else {
                    callback_p(null, u);
                }
            });
        }
    },
    function (err, result) {
        if (err) {
            callback(err, null);
        }
        else {
            clan.clan = result.clanBase;
            clan.members = result.members;
            callback(null, clan);
        }
    });
}

/*
*   Internal function for gathering clan metrics across all models
*/
function clanMetrics(clanId, callback) {
    var metrics = {};
    async.parallel({
        users: function (callback_p) {
            userModel.usersByClan(clanId, ['member','elder','coleader','leader'], function (err, users) {
                if (err) {
                    callback_p(err, null);
                }
                else {
                    callback_p(null, users);
                }
            });
        }
    }, function (err, results) {
        metrics.totalMembers = results.users.length;
        _.each(results.users, function (user) {
            if (user.role.title === 'leader') {
                metrics.leader = user.ign;
            }
        });
        callback(null, metrics);
    });
}

/*
*   Internal function for gathering clan metrics across all models
*/
function adminClanMetrics(clanId, callback) {
    var metrics = {};
    async.parallel({
        users: function (callback_p) {
            userModel.usersByClan(clanId, ['member','elder','coleader','leader'], function (err, users) {
                if (err) {
                    callback_p(err, null);
                }
                else {
                    callback_p(null, users);
                }
            });
        },
        wars: function(callback_p) {
            warModel.getFullHistory(clanId, function (err, wars) {
                if (err) {
                    callback_p(err, null);
                }
                else {
                    callback_p(null, wars);
                }                
            });
        }
    }, function (err, results) {
        metrics.totalMembers = results.users.length;
        metrics.totalWars = results.wars.length;
        _.each(results.users, function (user) {
            if (user.role.title === 'leader') {
                metrics.leader = { id: user._id, ign: user.ign };
            }
        });
        callback(null, metrics);
    });
}
