/*
*   Authentication endpoints
*/

var async = require('async'),
    passport = require('passport'),
    shortid = require('shortid');

var config       = require('../../config/config'),
    accountModel = require('../models/account-model'),
    mailModel    = require('../models/mail-model'),
    userModel    = require('../models/user-model');

/*
*   The registration process does the following:
*       1. Create a new user account
*       2. Create a new account for the user
*       3. Send a welcome email
*       4. Notify admins that a new account was created
*/
exports.register = function(req, res, next) {

    userModel.findByEmail(req.body.email_address, function(err, user) {
        if (err) {
            res.send(500, err);
        }
        else if (user) {
            res.send(403, 'User already exists');
        }
        else {

            // Step 1: create a new account for the user
            var new_account = {
                name: req.body.company,
                sku: 'Trial',
                reply_domain: '',
                ignore_domains: [req.body.email_address.split('@')[1]],
                forwards: {
                    human: [req.body.email_address],
                    unknown: [],
                    all: []
                },
                mx_verified: false,
                integration: {}
            };

            accountModel.saveModel(new_account, function (err, acct) {
                if (err) {
                    res.send(500, err);
                }
                else {
                    // Step 2: add the user
                    userModel.addUser(acct._id.toString(), req.body, function (err, user) {
                        if (err) {
                            res.send(500, err);
                        }
                        else {
                            async.parallel({
                                welcomeMail: function (callback_inner) {
                                    // Step 3: send a welcome email
                                    mailModel.welcome(user._id.toString(), function (err, data) {
                                        if (err) {
                                            callback_inner(err, null);
                                        }
                                        else {
                                            callback_inner(null, data);
                                        }
                                    });
                                },
                                adminMail: function (callback_inner) {
                                    // Step 4: send admins notification of new account creation
                                    var content =   '<p style="font-size: 18px; margin-bottom: 10px;">A new account was just created:</p>' +
                                                    '<table width="100%" cellpadding="6" cellspacing="0" border="0">' +
                                                        '<tr><td style="width: 140px;"><b>Account Name:</b></td><td>' + new_account.name + '</td></tr>' +
                                                        '<tr><td style="width: 140px;"><b>Contact:</b></td><td>' + new_account.forwards.human[0] + '</td></tr>' +
                                                    '</table>';

                                    mailModel.genericMail(config.admins, 'Siftrock: new account', content, function (err) {
                                        if (err) {
                                            logger.error('New account notification for admins failed: ' + err);
                                        }
                                        else {
                                            logger.info('Admins notified of new account: ' + new_account.name);
                                        }
                                        callback_inner(null, null);
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
            }); // end userModel.findByEmail
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
