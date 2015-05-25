/*
*   Image upload endpoints
*/

var model = require('../models/imageupload-model');


/*
*   Save a user avatar
*/
exports.uploadAvatar = function(req, res, next) {
    var newFileName = req.params.userId + req.files.file.name.substring(req.files.file.name.indexOf('.'), req.files.file.name.length);
    logger.warn(newFileName);
    model.upload('avatar', newFileName, req.files.file.path, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else {
            res.json(200, { newFile: newFileName});
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
