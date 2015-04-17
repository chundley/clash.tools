/*
*   Marketo endpoints
*/

var model  = require('../models/marketo-model'),
    config = require('../../config/config');

/*
*   Verifies credentials and returns the response, including a valid access token
*/
exports.verifyCredentials = function(req, res, next) {
    model.verifyCredentials(req.body.identity_url, req.body.client_id, req.body.client_secret, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, result);
        }
    });
};

/*
*   Gets static lists from the configured Marketo account
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
*   Get Siftrock specific writeable fields on a lead from Marketo
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
}
