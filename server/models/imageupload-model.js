/*
*   API for S3 image upload
*/
var AWS = require('aws-sdk')

var config = require('../../config/config');

exports.upload = function(folderName, fileName, file, callback) {

    AWS.config.update({
        accessKeyId: 'AKIAJAFS45XYTNTOIAGA',
        secretAccessKey: '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'
    });

    var bucket = new AWS.S3({
        params: {
            Bucket: 'clashtools'
        }
    });

    var params = { Key: 'test', Body: 'Hi there' };
    bucket.putObject(params, function (err, data) {
        if (err) {
            logger.error(err);
            callback(err, null);
        }
        else {
            // success?
            callback(null, null)
        }
    });

}