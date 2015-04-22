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
    messagelogModel.get(req.params.clanId, req.query.count, function (err, messages) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, messages);
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
