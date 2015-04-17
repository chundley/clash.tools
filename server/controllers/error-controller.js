/*
*   Error log endpoints
*/

var model = require('../models/error-model');

/*
*   Save an error message
*/
exports.save = function(req, res, next) {
    model.saveError(req.body, function (err, message) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, message);
        }
    });
};
