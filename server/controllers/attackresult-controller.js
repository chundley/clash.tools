/*
*   Attack result endpoints
*/

var attackResultModel = require('../models/attackresult-model');

/*
*   All attack history for a clan
*/
exports.findByClanId = function(req, res, next) {
    attackResultModel.findByClanId(req.params.clanId, function (err, results) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, results);
        }
    });
};

/*
*   All attack history for a war
*/
exports.findByWarId = function(req, res, next) {
    attackResultModel.findByWarId(req.params.warId, function (err, results) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, results);
        }
    });
};

/*
*   All attack history for a user
*/
exports.findByUserId = function(req, res, next) {
    attackResultModel.findByUserId(req.params.userId, function (err, results) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, results);
        }
    });
};