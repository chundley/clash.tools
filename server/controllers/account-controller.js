/*
*   Account endpoints
*/

var async = require('async'),
    _     = require('underscore');

var accountModel   = require('../models/account-model'),
    analyticsModel = require('../models/analytics-model'),
    userModel      = require('../models/user-model'),
    mailModel      = require('../models/mail-model');

/*
*   Save an account
*/
exports.save = function(req, res, next) {
    accountModel.saveModel(req.body, function (err, model) {
        if (err) {
            res.send(400, err);
        }
        else {
            res.json(200, model);
        }
    });
};

/*
*   Find account by id
*/
exports.findById = function(req, res, next) {
    accountModel.findById(req.params.id, function (err, item) {
        if (err) {
            res.send(500, err);
        }
        else if (item) {
            res.json(200, item);
        }
        else {
            res.send(404, 'not found');
        }
    });
};

/*
*   Find account by user id
*/
exports.findByUserId = function(req, res, next) {
    accountModel.findByUserId(req.params.id, function (err, item) {
        if (err) {
            res.send(500, err);
        }
        if (item) {
            res.json(200, item);
        }
        else {
            res.send(404, 'not found');
        }
    });
};

exports.addUser = function(req, res, next) {
    // make sure the user doesn't exist already
    userModel.findByEmail(req.body.email_address, function (err, user) {
        if (err) {
            res.send(500, err);
        }
        else if (user) {
            res.send(403, 'User already exists');
        }
        else {
            userModel.addUser(req.params.id, req.body, function (err, user) {
                if (err) {
                    res.send(500, err);
                }
                else {
                    // for now, removing the verify step for invited users. In theory a user should already be verified if another
                    // person is adding them
                    async.parallel({
                        inviteMail: function (callback_inner) {
                            userModel.findById(req.body.created_by, function (err, fromUser) {
                                if (err) {
                                    callback_inner(err, null);
                                }
                                else {
                                    // Send a welcome email
                                    mailModel.invite(user._id.toString(), req.body.temp_password, fromUser.name, function (err, data) {
                                        if (err) {
                                            callback_inner(err, null);
                                        }
                                        else {
                                            callback_inner(null, data);
                                        }
                                    });
                                }
                            });
                        }
                    },
                    function (err, results) {
                        if (err) {
                            res.send(500, err);
                        }
                        else {
                            res.json(200, user);
                        }
                    }); // end async.parallel
                }
            }); // end userModel.addUser
        }
    }); // end userModel.findByEmail
}

exports.adminAllAccounts = function(req, res, next) {
    accountModel.adminAllAccounts(function (err, accounts) {
        if (err) {
            res.send(500, err);
        }
        else {
            async.each(accounts, function (account, callback) {
                async.parallel({
                    emailCount: function(callback_inner) {
                        analyticsModel.emailCountByType(account._id.toString(), 3650, function (err, counts) {
                            if (err) {
                                callback_inner(err, null);
                            }
                            else {
                                var count = 0;
                                _.each(counts, function (c) {
                                    count += c.count;
                                });
                                callback_inner(null, count);
                            }
                        });
                    },
                    userCount: function(callback_inner) {
                        userModel.getByAccount(account._id.toString(), function (err, users) {
                            if (err) {
                                callback_inner(err, null);
                            }
                            else {
                                var firstAdmin = null;
                                for (var i=0; i<users.length; i++) {
                                    if (users[i].role.title == 'admin' || users[i].role.title == 'sadmin') {
                                        firstAdmin = users[i]._id.toString();
                                        break;
                                    }
                                }
                                callback_inner(null, { users: users.length, firstAdmin: firstAdmin} );
                            }
                        });
                    }
                }, function (err, results) {
                    account.mail_count = results.emailCount;
                    account.user_count = results.userCount.users;
                    account.first_admin = results.userCount.firstAdmin;
                    callback();
                });

            },
            function (err) {
                if (err) {
                    res.send(500, err);
                }
                else {
                    res.json(200, accounts);
                }
            });
        }
    });
}
