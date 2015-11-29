/*
*   CRUD API for error messages
*/

var async    = require('async');

/*
*   Gets summary of clashtools usage
*/
exports.summaryMetrics = function(callback) {

    async.parallel({
        clans: function (callback_p) {
            db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'clan', function (err, collection) {
                if (err) {
                    callback(err, null);
                }
                else {
                    collection.count(function (err, count) {
                        if (err) {
                            logger.error(err);
                            callback_p(err, null);
                        }
                        else {
                            callback_p(null, count);
                        }
                    });
                }
            });
        },
        members: function (callback_p) {
            db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'user', function (err, collection) {
                if (err) {
                    callback(err, null);
                }
                else {
                    collection.count(function (err, count) {
                        if (err) {
                            logger.error(err);
                            callback_p(err, null);
                        }
                        else {
                            callback_p(null, count);
                        }
                    });
                }
            });
        },
        attacks: function (callback_p) {
            db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'attack_result', function (err, collection) {
                if (err) {
                    callback(err, null);
                }
                else {
                    collection.count(function (err, count) {
                        if (err) {
                            logger.error(err);
                            callback_p(err, null);
                        }
                        else {
                            callback_p(null, count);
                        }
                    });
                }
            });
        }
    }, function (err, results) {
        if (err) {
            callback(err, null);
        }
        else {
            var ret = {
                clans: results.clans,
                members: results.members,
                attacks: results.attacks
            };
            callback(null, ret);
        }
    });
}
