/*
*   CRUD API for users
*/

var LocalStrategy = require('passport-local').Strategy,
    ObjectID      = require('mongodb').ObjectID;


var config    = require('../../config/config'),
    util      = require('../../app/shared/util'),
    userRoles = require('../../app/shared/role-config').userRoles;

exports.addUser = function(user, callback) {
    var now = new Date();
    var user = {
        email_address: user.email_address,
        ign: user.ign,
        password: user.password,
        role: user.role,
        enabled: true,
        current_clan: {},
        clan_history: [],
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
                    callback(null, result);
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
        db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
            if (err) {
                callback(err, null);
            }
            else {
                collection.findOne( { 'role.title': 'leader' }, function (err, leader) {
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

/*
*   Updates a user's clan. The "newClan" flag indicates a new clan was created. In that case
*   the user needs to be set as leader
*/
exports.updateClan = function(userId, clan, newClan, callback) {
    if (_.isString(userId)) {
        userId = new ObjectID.createFromHexString(userId);
    }

    // an empty clan object will e passed in if the member is being kicked
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

    var updateFields = {
        current_clan: clanTrimmed
    };

    var pushClan = { clan_history: clanTrimmed };

    if (newClan) {
        updateFields.role = { bitMask: 16, title: 'leader' };
    }

    if (!clan._id) {
        // anyone kicked goes back to member
        updateFields.role = { bitMask: 2, title: 'member' };
        pushClan = {};
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.update(
                { _id: userId },
                { $set: updateFields, $push: { clan_history: clanTrimmed } },
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
            collection.find( whereClause, { _id: 1, ign: 1, role: 1, 'current_clan.joined': 1 } )
            .sort( {ign: 1} )
            .toArray(function (err, items) {
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
* Updates a record and returns the record
*/
exports.saveModel = function(model, callback) {
    if (!model._id) {
        callback('invalid model', null);
    }

    else {
        model._id = new ObjectID.createFromHexString(model._id);
        model.created_at = new Date(model.created_at);
        model.last_updated_at = new Date();

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
*   Get all users
*/
exports.getAllUsers = function(callback) {
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
}

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
