/*
*   Mail endpoints
*/

var model = require('../models/mail-model');


/*
*   Reset a forgotten password
*/
exports.pwReset = function(req, res, next) {
    logger.error(req.params.email);
    model.pwReset(req.params.email, function (err, item) {
        if (err) {
            res.send(500, err);
        }
        else if (item) {
            res.json(item);
        }
        else {
            res.json(404, 'not found');
        }
    });
};

/*
*   Send an email verification email
*/
exports.verifyEmail = function(req, res, next) {
    model.verifyEmail(req.params.id, function (err, item) {
        if (err) {
            res.send(500, err);
        }
        else if (item) {
            res.json(item);
        }
        else {
            res.send(404, 'not found');
        }
    });
};

/*
*   Welcome email for a new user
*/
exports.welcome = function(req, res, next) {
    model.welcome(req.params.id, function (err, item) {
        if (err) {
            res.send(500, err);
        }
        if (item) {
            res.json(item);
        }
        else {
            res.send(404, 'not found');
        }
    });
};

/*
*   Form submitted on web site - sends data to admins
*/
exports.wwwForm = function(req, res, next) {
    model.wwwForm(req.body, function (err) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, 'Success');
        }
    });
}