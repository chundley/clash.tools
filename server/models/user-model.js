/*
*   CRUD API for users
*/

var LocalStrategy = require('passport-local').Strategy,
    ObjectID      = require('mongodb').ObjectID;


var config = require('../../config/config'),
    util   = require('../../app/shared/util');

exports.addUser = function(account_id, user, callback) {
    var now = new Date();
    var user = {
        account_id: account_id,
        name: user.name,
        email_address: user.email_address,
        nickname: user.nickname,
        password: user.password,
        role: user.role,
        enabled: true,
        verified: user.verified,
        verify_token: util.createGUID(),
        session_data: {
            settings_tab: 'account',
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
            },
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
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { _id: new ObjectID.createFromHexString(id) }, function (err, item) {
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
