/*
*   Password reset endpoints
*/

var model = require('../models/pwreset-model');


/*
*   Find password reset request by token
*/
exports.findByToken = function(req, res, next) {
    model.findByToken(req.params.token, function (err, item) {
        if (err) {
            res.send(500, err);
        }
        else if (item) {
            res.json(200, item);
        }
        else {
            res.send(404, 'not found');
        }
    });
};
