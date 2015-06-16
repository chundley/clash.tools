/*
*   Analytics endpoints
*/

var analyticsModel = require('../models/analytics-model');

/*
*   All attack history for a clan
*/
exports.summaryMetrics = function(req, res, next) {
    analyticsModel.summaryMetrics(function (err, results) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, results);
        }
    });
};
