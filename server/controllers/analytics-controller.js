/*
*   Analytics endpoints
*/

var analytics = require('../models/analytics-model');


/*
*   For a given account, get summary data for dashboard widgets
*/
exports.summary = function(req, res, next) {
    analytics.summary(req.params.account_id, req.query.days, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else if (result) {
            res.json(200, result);
        }
        else {
            res.send(404, 'not found');
        }
    });
}


/*
*   For a given account, get the number of emails grouped by day for the number of days passed
*   in the query string
*/
exports.emailCountByDay = function(req, res, next) {
    analytics.emailCountByDay(req.params.account_id, req.query.days, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else if (result) {
            res.json(200, result);
        }
        else {
            res.send(404, 'not found');
        }
    });
}

/*
*   For a given account, get the number of emails grouped by type for the number of days passed
*   in the query string
*/
exports.emailCountByType = function(req, res, next) {
    analytics.emailCountByType(req.params.account_id, req.query.days, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else if (result) {
            res.json(200, result);
        }
        else {
            res.send(404, 'not found');
        }
    });
}

/*
*   For a given account, get the number of new contacts grouped by type for the number of days passed
*   in the query string
*/
exports.personCountByType = function(req, res, next) {
    analytics.personCountByType(req.params.account_id, req.query.days, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else if (result) {
            res.json(200, result);
        }
        else {
            res.send(404, 'not found');
        }
    });
}

/*
*   For a given account, get all contacts for the number of days passed
*   in the query string
*/
exports.allPeople = function(req, res, next) {
    analytics.allPeople(req.params.account_id, req.query.days, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else if (result) {
            res.json(200, result);
        }
        else {
            res.send(404, 'not found');
        }
    });
}