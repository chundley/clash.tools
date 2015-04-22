/*
*   App email message endpoints
*/

var async = require('async'),
    _     = require('underscore');

var emailMessageModel = require('../models/emailmessage-model'),
    userModel         = require('../models/user-model');

/*
*   Save an message
*/
exports.save = function(req, res, next) {
    emailMessageModel.save(req.body, function (err, message) {
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
    emailMessageModel.get(req.params.userId, req.query.count, function (err, messages) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, messages);
        }
    });
};

/*
*   Mark an email message as "read"
*/
exports.read = function(req, res, next) {
    emailMessageModel.updateField(req.params.messageId, 'read', true, function (err, message) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.send(200, 'ok');
        }
    });
}

/*
*   Mark an email message as "deleted"
*/
exports.delete = function(req, res, next) {
    emailMessageModel.updateField(req.params.messageId, 'deleted', true, function (err, message) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.send(200, 'ok');
        }
    });
}