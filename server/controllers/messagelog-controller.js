/*
*   Message log endpoints
*/

var async = require('async'),
    _     = require('underscore');

var messagelogModel = require('../models/messagelog-model'),
    accountModel    = require('../models/account-model'),
    userModel       = require('../models/user-model');

/*
*   Save an message
*/
exports.save = function(req, res, next) {
    messagelogModel.save(req.body, function (err, message) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, message);
        }
    });
};

/*
*   Get last N messages - query string parameter = count
*/
exports.get = function(req, res, next) {
    accountModel.findByUserId(req.params.user_id, function (err, account) {
        if (err) {
            res.send(500, err);
        }
        else {
            messagelogModel.get(account._id.toString(), req.params.user_id, req.query.count, function (err, messages) {
                if (err) {
                    res.send(500, err);
                }
                else {
                    userModel.getByAccount(account._id.toString(), function (err, users) {
                        if (err) {
                            res.send(500, err);
                        }
                        else {
                            async.each(messages, function (message, callback) {
                                _.each(users, function (user) {
                                    if (message.user_id == user._id.toString()) {
                                        message.user_nickname = user.nickname;
                                    }
                                });
                                callback();
                            },
                            function (err) {
                                if (err) {
                                    res.send(500, err);
                                }
                                else {
                                    res.json(200, messages);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};

exports.dismiss = function(req, res, next) {
    messagelogModel.dismiss(req.params.user_id, req.params.message_id, function (err, message) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.send(200, 'ok');
        }
    });
}
