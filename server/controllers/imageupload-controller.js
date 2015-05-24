/*
*   Image upload endpoints
*/

var model = require('../models/imageupload-model');


/*
*   Save a user avatar
*/
exports.uploadAvatar = function(req, res, next) {
    logger.warn(req.files.file);

    model.upload('avatar', req.files.file.name, req.files.file.path, function (err, message) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, message);
        }
    });
};


/*
*   Save a clan image
*/
exports.uploadClan = function(req, res, next) {
    //model.upload(req.body, function (err, message) {
    model.upload(null, req.files.file.name, req.files.file.path, function (err, message) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, message);
        }
    });
};
