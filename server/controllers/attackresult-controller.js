/*
*   Attack result endpoints
*/

var attackResultModel = require('../models/attackresult-model');

/*
*   Save a clan
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
