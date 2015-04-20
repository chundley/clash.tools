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
                    req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7;
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
