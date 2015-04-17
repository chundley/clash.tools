/*
*   NLP config endpoints
*/

var async = require('async'),
    _     = require('underscore');

var nlpConfigModel = require('../models/nlpconfig-model');

/*
*   Save NLP config
*/
exports.save = function(req, res, next) {
    nlpConfigModel.saveConfig(req.body, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.send(200, 'ok');
        }
    });
};

/*
*   Get last N messages - query string parameter = count
*/
exports.get = function(req, res, next) {
    nlpConfigModel.getConfig(function (err, nlpConf) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, nlpConf);
        }
    });
};
