/*
*   CRUD API for users
*/

var LocalStrategy = require('passport-local').Strategy,
    ObjectID      = require('mongodb').ObjectID,
    async         = require('async'),
    _             = require('underscore');


var util              = require('../../app/shared/util'),
    userRoles         = require('../../app/shared/role-config').userRoles,
    emailMessageModel = require('./emailmessage-model'),
    messageLogModel   = require('./messagelog-model');


exports.addUser = function(user, callback) {
    var now = new Date();
    var user = {
        email_address: user.email_address.toLowerCase(),
        ign: user.ign,
        player_tag: user.player_tag,
        password: user.password,
        role: user.role,
        enabled: true,
        verified: false,
        current_clan: {},
        clan_history: [],
        profile: user.profile,
        verified: user.verified,
        verify_token: util.createGUID(),
        session_data: {
/*            settings_tab: 'account',
            dashboard_filters: {
                days: 90,
                last_changed: now
            },
            stream_style: 'email',
            stream_per_page: 10,
            stream_filters: {
                days: 30,
                type: 'all',
                recipient: '',
                first_id: 0,
                last_id: 0,
                first_date: 0,
                last_date: 0,
                last_changed: now
            },*/
            ui_flags: {}
        },
        mail_settings: {
            enabled: true,
            bounced: false
        },
        last_login: now,
        created_at: now,
        last_updated_at: now
    };

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.save(user, function (err, result) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, result.ops[0]);
                }
            });
        }
    });
}

/*
*   Updates a user's role - promotions and demotions
*/
exports.updateRole = function (userId, role, callback) {
    if (role == 'leader') {
        // if promoting a new leader, need to set the old leader as co-leader first

        // need their current clan in order to set the right value
        exports.findById(userId, function (err, user) {
            if (err) {
                callback(err, null);
            }
            else {
                db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        collection.findOne( {'current_clan.clan_id': user.current_clan.clan_id, 'role.title': 'leader' }, function (err, leader) {
                            if (err) {
                                callback(err, null);
                            }
                            else {
                                changeRole(leader._id, 'coleader', function (err, co) {
                                    if (err) {
                                        callback(err, null);
                                    }
                                    else {
                                        changeRole(userId, role, function (err, l) {
                                            if (err) {
                                                callback(err, null);
                                            }
                                            else {
                                                callback(null, l);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    else {
        changeRole(userId, role, function (err, member) {
            if (err) {
                    callback(err, null);
            }
            else {
                callback(null, member);
            }
        });
    }
}

function changeRole(userId, role, callback) {
    if (_.isString(userId)) {
        userId = new ObjectID.createFromHexString(userId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.update(
                { _id: userId },
                { $set: { role: userRoles[role] } },
                { upsert: false },
                function (err, result) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        exports.findById(userId, function (err, u) {
                            callback(null, u);
                        });

                    }
                }
            );
        }
    });
}

exports.updateFromRoster = function(userId, model, callback) {
    if (_.isString(userId)) {
        userId = new ObjectID.createFromHexString(userId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.update(
                { _id: userId },
                { $set: {
                            'profile.warWeight': model.w,
                            'profile.buildings.th': model.th,
                            'profile.heroes.bk': model.bk,
                            'profile.heroes.aq': model.aq,
                            'profile.heroes.gw': model.gw
                        }
                },
                { upsert: false },
                function (err, result) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        exports.findById(userId, function (err, u) {
                            callback(null, u);
                        });

                    }
                }
            );
        }
    });
}

/*
*   Does a join request for a clan. This was moved to the back-end from the front end to plug security
*   holes where the front-end would need a list of clan leaders in order to execute a join request
*/
exports.joinClan = function(userId, metaData, callback) {
    if (_.isString(userId)) {
        userId = new ObjectID.createFromHexString(userId);
    }

    exports.usersByClan(metaData.clanId, ['leader', 'coleader'], function (err, members) {
        if (err) {
            callback(err, null);
        }
        else {
            _.each(members, function (member) {
                metaData.email.to_users.push(
                    {
                        user_id: member._id,
                        ign: member.ign,
                        read: false,
                        deleted: false
                    }
                );
            });

            emailMessageModel.save(metaData.email, function (err, result) {
                if (err) {
                    callback(err, null);
                }
                else {
                    var newMsg = {
                        clan_id: metaData.clanId,
                        user_id: userId.toString(),
                        message: '[ign] would like to join the clan',
                        ign: metaData.email.from_user.ign,
                        type: 'member' /* member, target (called), target (attacked), delete (deleted call), special (start war), note (base notes) */
                    };

                    messageLogModel.save(newMsg, function (err, msg) {
                        if (err) {
                            logger.warn('Problem saving message log on member join attempt');
                        }
                    });

                    callback(null, true);
                }
            });
        }
    });
}

/*
*   Updates a user's clan. The "newClan" flag indicates a new clan was created. In that case
*   the user needs to be set as leader
*
*   An empty clan object will be passed in if the member is being kicked
*/
exports.updateClan = function(userId, clan, newClan, callback) {
    if (_.isString(userId)) {
        userId = new ObjectID.createFromHexString(userId);
    }

    // create the new clan object (empty if someone left or booted)
    var clanTrimmed = {
    };

    if (clan._id) {
        clanTrimmed.clan_id = clan._id;
        clanTrimmed.name = clan.name;
        clanTrimmed.clan_tag = clan.clan_tag;
        clanTrimmed.joined = new Date();

        if (_.isString(clanTrimmed.clan_id)) {
            clanTrimmed.clan_id = new ObjectID.createFromHexString(clanTrimmed.clan_id);
        }
    }

    // check for user already in clan, if not then add them (or remove if that's the case)
    async.waterfall([
        function (callback_wf) {
            if (clanTrimmed.clan_id) {
                exports.findById(userId, function (err, user) {
                    if (err) {
                        callback_wf(err, null);
                    }
                    else {
                        if (user.current_clan.clan_id
                            && clanTrimmed.clan_id
                            && user.current_clan.clan_id.toString() == clanTrimmed.clan_id.toString()) {
                            logger.info('User ' + user.ign + ' already in clan ' + clanTrimmed.name);
                            callback_wf(null, true);
                        }
                        else {
                            callback_wf(null, false);
                        }
                    }
                });
            }
            else {
                callback_wf(null, false);
            }
        },
        function (inClan, callback_wf) {
            // only add to clan if they aren't already in it
            if (!inClan) {
                var updateFields = {
                    current_clan: clanTrimmed
                };

                if (newClan) {
                    updateFields.role = { bitMask: 16, title: 'leader' };
                }

                if (!clan._id) {
                    // anyone kicked goes back to member
                    updateFields.role = { bitMask: 2, title: 'member' };

                    // update clan to nothing
                    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
                        if (err) {
                            callback_wf(err, null);
                        }
                        else {
                            collection.update(
                                { _id: userId },
                                { $set: updateFields },
                                { upsert: false },
                                function (err, result) {
                                    if (err) {
                                        callback_wf(err, null);
                                    }
                                    else {
                                        callback_wf(null, result);
                                    }
                                }
                            );
                        }
                    });
                }
                else {
                    // different query because we need to push a record to clan_history
                    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
                        if (err) {
                            callback_wf(err, null);
                        }
                        else {
                            collection.update(
                                { _id: userId },
                                { $set: updateFields, $push: { clan_history: clanTrimmed } },
                                { upsert: false },
                                function (err, result) {
                                    if (err) {
                                        callback_wf(err, null);
                                    }
                                    else {
                                        callback_wf(null, result);
                                    }
                                }
                            );
                        }
                    });
                }
            }
            else {
                callback(null, null);
            }
        }

    ], function (err, results) {
        if (err) {
            callback(err, null);
        }
        else {
            callback(null, results)
        }
    });
}

/*
*   Gets all members of a clan with an optional parameter for level (elder/coleader/leader) passed in as an
*   array, such as ['coleader', 'leader']
*/
exports.usersByClan = function(clanId, memberTypes, callback) {
    if (_.isString(clanId)) {
        clanId = new ObjectID.createFromHexString(clanId);
    }

    var whereClause = {
        'current_clan.clan_id': clanId
    };

    if (memberTypes.length > 0) {
        whereClause['role.title'] = {
            $in: memberTypes
        };
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find( whereClause, { _id: 1, ign: 1, 'role.title': 1, profile: 1, 'current_clan.joined': 1 } )
            .sort( {ign: 1} )
            .toArray(function (err, items) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (items) {
                        items.sort(function (a, b) {
                            if (a.ign.toLowerCase() < b.ign.toLowerCase()) {
                                return -1
                            }
                            else if (a.ign.toLowerCase() > b.ign.toLowerCase()) {
                                return 1;
                            }
                            else {
                                return 0;
                            }
                        });

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
*   Updates a record and returns the record
*/
exports.saveModel = function(model, callback) {
    if (!model._id) {
        callback('invalid model', null);
    }
    else {
        if (_.isString(model._id)) {
            model._id = new ObjectID.createFromHexString(model._id);
        }

        if (model.current_clan.clan_id && _.isString(model.current_clan.clan_id)) {
            model.current_clan.clan_id = new ObjectID.createFromHexString(model.current_clan.clan_id);
        }

        _.each(model.clan_history, function (clan) {
            if (clan.clan_id && _.isString(clan.clan_id)) {
                clan.clan_id = new ObjectID.createFromHexString(clan.clan_id);
            }
        });

        model.created_at = new Date(model.created_at);
        model.last_updated_at = new Date();

        model.email_address = model.email_address.toLowerCase();


        // Get existing model for role, since we don't want to overwrite role when a profile is saved. The only
        // way to update role is through the updateRole function

        exports.findById(model._id, function (err, user) {
            if (err) {
                callback(err);
            }
            else {
                model.role = user.role;
                db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
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
        });
    }
}

/*
*   Saves a user session
*/
exports.saveSession = function(id, session, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.update(
                { _id: new ObjectID.createFromHexString(id) },
                { $set: { session_data: session } },
                { upsert: false },
                function (err, result) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        callback(null, result);
                    }
                }
            );
        }
    });
}

exports.updateLastLogin = function(id) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            //callback(err, null)
        }
        else {
            collection.update(
                { _id: id },
                { $set: { last_login: new Date() } },
                { upsert: false },
                function (err, result) {
                    if (err) {
                        //callback(err, null);
                    }
                    else {
                        //callback(null, result);
                    }
                }
            );
        }
    });
}

exports.setVerified = function(id, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.update(
                { _id: new ObjectID.createFromHexString(id) },
                { $set: { verified: true } },
                { upsert: false },
                function (err, result) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        callback(null, result);
                    }
                }
            );
        }
    });
}

exports.changePassword = function(id, pw, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.update(
                { _id: new ObjectID.createFromHexString(id) },
                { $set: { password: pw.new_password } },
                { upsert: false },
                function (err, result) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        callback(null, result);
                    }
                }
            );
        }
    });
}

exports.disable = function(id, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.update(
                { _id: new ObjectID.createFromHexString(id) },
                { $set: { enabled: false } },
                { upsert: false },
                function (err, result) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        callback(null, result);
                    }
                }
            );
        }
    });
}

exports.findById = function(id, callback) {

    if (_.isString(id)) {
        id = new ObjectID.createFromHexString(id);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { _id: id }, function (err, item) {
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
*   Find user by email address
*/
exports.findByEmail = function(email, callback) {
    email = email.toLowerCase();

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { email_address: email }, function (err, item) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (item) {
                        callback(null, item);
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
*   Find user by verify token
*/
exports.findByVerifyToken = function(token, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { verify_token: token }, function (err, item) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (item) {
                        callback(null, item);
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
*   Get all users for an account
*/
exports.getByAccount = function(account_id, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find( {account_id: account_id, enabled: true }, { password: 0 } ).sort({last_login: -1}).toArray(function (err, items) {
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
*   Set email updates enabled to false and bounces true for email addresses that have bounced in the past
*/
exports.adminSetBounces = function(bounces, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            var count = 0;
            async.each(bounces.emails, function (email, callback_each) {
                collection.update(
                    { email_address: email },
                    { $set: { mail_settings: { enabled: false, bounced: true } } },
                    { upsert: false },
                    function (err, result) {
                        if (err) {
                            callback_each(err, null);
                        }
                        else {
                            if (result.result.nModified > 0) {
                                count++;
                            }
                            callback_each(null, result);
                        }
                    }
                );
            }, function (err) {
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

/*
*   Gets all users in the system with an enabled and non bounced email address
*/
exports.allUsersValidEmail = function(callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find({ 'mail_settings.enabled': true, 'mail_settings.bounced': false }, {ign: 1, email_address: 1}).toArray(function (err, items) {
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
*   Get all users
*/
/*exports.getAllUsers = function(callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find({}, {password: 0}).sort({last_login: -1}).toArray(function (err, items) {
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
}*/

/*
*   Gets new users created in the last n hours
*/
exports.opsUsers = function(hours, callback) {
    var now = new Date();
    now.setTime(now.getTime() - (hours*60*60*1000));

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find({ created_at: { $gte: now } }, { email_address: 1, created_at: 1 } ).sort({created_at: -1}).toArray(function (err, items) {
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


// passport stuff for local auth strategy and user serialization
exports.localStrategy = new LocalStrategy(
    {
        usernameField: 'email',
        passwordField: 'password'
    },
    function (username, password, done) {
        module.exports.findByEmail(username, function (err, user) {
            if (err) {
                done(null, false, { message: 'Invalid'});
            }
            else if (!user) {
                done(null, false, { message: 'Invalid'} );
            }
            else if (user.password != password) {
                done(null, false, { message: 'Invalid'} );
            }
            else {
                return done(null, user);
            }
        });
    }
)

exports.serializeUser = function(user, done) {
    done(null, user.id);
}

exports.deserializeUser = function(id, done) {
    module.exports.findById(id, function (err, user) {
        if (err) {
            done(null, false);
        }
        else if (user) {
            var loginUser = {
                id: user._id,
                email: user.email_address,
                role: user.role
            };
            done(null, loginUser);
        }
        else {
            done(null, false);
        }
    });
}
