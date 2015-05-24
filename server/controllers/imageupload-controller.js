/*
*   Error log endpoints
*/

var model = require('../models/imageupload-model');

/*
*   Save an error message
*/
exports.upload = function(req, res, next) {
    //model.upload(req.body, function (err, message) {
    model.upload(null, null, null, function (err, message) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, message);
        }
    });
};
