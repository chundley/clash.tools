/*
*   Authentication endpoints
*/

var async = require('async'),
    passport = require('passport'),
    shortid = require('shortid');

var config       = require('../../config/config'),
    mailModel    = require('../models/mail-model'),
    userModel    = require('../models/user-model');

/*
*   The registration process does the following:
*       1. Create a new user account
*       2. Send a welcome email
*/
exports.register = function(req, res, next) {

    userModel.findByEmail(req.body.email_address, function (err, user) {
        if (err) {
            res.send(500, err);
        }
        else if (user) {
            res.send(403, 'User already exists');
        }
        else {
            // Step 1: add the user
            userModel.addUser(req.body, function (err, user) {
                if (err) {
                    res.send(500, err);
                }
                else {
                    async.parallel({
                        welcomeMail: function (callback_inner) {
                            // Step 2: send a welcome email
                            mailModel.welcome(user._id.toString(), function (err, data) {
                                if (err) {
                                    callback_inner(err, null);
                                }
                                else {
                                    callback_inner(null, data);
                                }
                            });
                        }
                    },
                    function (err, results) {
                        if (err) {
                            next(err);
                        }
                        else {
                            var loginUser = {
                                id: user._id.toString(),
                                email: user.email_address,
                                role: user.role
                            };
                            // log the user in once everything else is done
                            req.login(loginUser, function (err) {
                                if (err) {
                                    next(err);
                                }
                                else {
                                    res.json(200, loginUser);
                                }
                            });
                        }
                    }); // end async.parallel
                }
            }); // end userModel.addUser
        }
    });
}

exports.login = function(req, res, next) {

    passport.authenticate('local', function (err, user) {
        if (err) {
            next(err);
        }
        if (!user) {
            res.send(404);
        }
        else {
            userModel.updateLastLogin(user._id);

            var loginUser = {
                id: user._id,
                email: user.email_address,
                role: user.role
            };

            req.login(loginUser, function (err) {
                if (err) {
                    return next(err);
                }

                if (req.body.remember) {
                    req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
                }
                res.json(200, loginUser);
            });
        }
    })(req, res, next);
}

exports.logout = function(req, res) {
    req.logout();
    res.send(200);
}

/*
*   Make sure a user should have access to a user account
*/
exports.authUserAccessByUserId = function(reqUser, userId, callback) {
    if (reqUser.id == userId) {
        // request for a user from the user
        callback(null, true);
    }
    else if (reqUser.role.title == 'sadmin') {
        // super admin all access
        callback(null, true);
    }
    else {
        // need to check for clan leader authorized to access user
        if (reqUser.role.title == 'coleader' || reqUser.role.title == 'leader') {
            async.parallel({
                requestor: function (callback_p) {
                    userModel.findById(reqUser.id, function (err, user) {
                        if (err) {
                            callback_p(err, null);
                        }
                        else {
                            callback_p(null, user);
                        }
                    });
                },
                requested: function (callback_p) {
                    userModel.findById(userId, function (err, user) {
                        if (err) {
                            callback_p(err, null);
                        }
                        else {
                            callback_p(null, user);
                        }
                    });
                }
            }, function (err, results) {
                if (err) {
                    callback(err, false);
                }
                else {
                    if (!results.requested.current_clan.clan_id || results.requested.current_clan.clan_id.toString().length == 0) {
                        // HACK: this is a leader authorizing a new memmber
                        callback(null, true);
                    }
                    else if (results.requestor.current_clan.clan_id.toString() == results.requested.current_clan.clan_id.toString()) {
                        callback(null, true);
                    }
                    else {
                        callback('Not authorized', false);
                    }
                }
            });
        }
        else {
            callback('Not authorized', false);
        }
    }
}


/*
*   Make sure a user should have access to a clan
*/
exports.authClanAccessByClanId = function(reqUser, reqMethod, clanId, callback) {
    if (reqUser.role.title == 'sadmin') {
        // super admin all access
        callback(null, true);
    }
    else {
        async.parallel({
            authorized: function (callback_p) {
                if (reqMethod=='POST') {
                    if (reqUser.role.title=='leader' || reqUser.role.title=='coleader') {
                        callback_p(null, true);
                    }
                    else {
                        callback_p(null, false);
                    }
                }
                else {
                    callback_p(null, true);
                }
            },
            requestor: function (callback_p) {
                userModel.findById(reqUser.id, function (err, user) {
                    if (err) {
                        callback_p(err, null);
                    }
                    else {
                        callback_p(null, user);
                    }
                });
            }
        }, function (err, results) {
            if (err) {
                callback(err, false);
            }
            else {
                if (results.authorized && results.requestor.current_clan.clan_id.toString() == clanId) {
                    callback(null, true);
                }
                else {
                    callback('Not authorized', false);
                }
            }
        });
    }
}