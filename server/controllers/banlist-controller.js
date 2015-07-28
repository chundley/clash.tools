/*
*   Ban list endpoints
*/

var banlistModel = require('../models/banlist-model');

/*
*   Save an message
*/
exports.save = function(req, res, next) {
    banlistModel.save(req.body, function (err, banned) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, banned);
        }
    });
};

/*
*   Get ban list for clan
*/
exports.get = function(req, res, next) {
    banlistModel.get(req.params.clanId, function (err, list) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, list);
        }
    });
};

/*
*   Get a user's ban record
*/
exports.getByUserId = function(req, res, next) {
    banlistModel.getByUserId(req.params.clanId, req.params.userId, function (err, record) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, record);
        }
    });
};

/*
*   Take player off ban list
*/
exports.delete = function(req, res, next) {
    banlistModel.delete(req.params.clanId, req.params.userId, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, 'Success');
        }
    });
};