/*
*   CRUD API for nlp config
*/

var ObjectID = require('mongodb').ObjectID;

var config = require('../../config/config');

/*
*   Saves nlp configuration
*/
exports.saveConfig = function(nlpConf, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'nlp_config', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            var id = nlpConf._id;
            delete nlpConf._id;
            collection.update({ _id: ObjectID.createFromHexString(id) }, nlpConf, function (err, result, status) {
                if (err) {
                    logger.error(err);
                    callback(err, null);
                }
                else {
                    callback(null, result);
                }
            });
        }
    });
}

/*
*   Gets nlp configuration
*/
exports.getConfig = function(callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'nlp_config', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne(function (err, nlpConf) {
                if (err) {
                    logger.error(err);
                    callback(err, null);
                }
                else {
                    if (nlpConf) {
                        callback(null, nlpConf);
                    }
                    else {
                        callback(null, null);
                    }
                }
            });
        }
    });
}
