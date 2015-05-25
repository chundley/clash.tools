/*
*   API for S3 image upload
*/
var AWS = require('aws-sdk'),
    fs  = require('fs');

var config = require('../../config/config');

exports.upload = function(folderName, fileName, file, callback) {

    // the file is stored locally, need to read it into a buffer and upload
    fs.readFile(file, function (err, data) {
        if (err) {
            logger.error(err);
        }
        else {
            AWS.config.update({
                accessKeyId: 'AKIAJAFS45XYTNTOIAGA',
                secretAccessKey: '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'
            });

            var bucket = new AWS.S3({
                params: {
                    Bucket: 'clashtools/' + folderName,
                    CacheControl: 'public, max-age=0'
                }
            });

            var params = { Key: fileName, Body: data };
            bucket.putObject(params, function (err, response) {
                if (err) {
                    logger.error(err);
                    callback(err, null);
                }
                else {
                    // success?
                    logger.warn(response);
                    callback(null, null)
                }
            });
        }
    });



}