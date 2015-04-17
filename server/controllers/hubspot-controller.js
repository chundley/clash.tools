/*
*   Hubspot endpoints
*/

var model  = require('../models/hubspot-model'),
    config = require('../../config/config');

/*
*   Verifies credentials and returns the response, including a valid access token
*/
exports.verifyCredentials = function(req, res, next) {
    model.verifyCredentials(req.params.accountId, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, result);
        }
    });
};

/*
*   Gets static lists from the configured Hubspot account
*/
exports.getLists = function(req, res, next) {
    model.getLists(req.params.accountId, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, result);
        }
    });
};

/*
*   Gets Siftrock lead fields from the configured Hubspot account
*/
exports.getFields = function(req, res, next) {
    model.getFields(req.params.accountId, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, result);
        }
    });
};
