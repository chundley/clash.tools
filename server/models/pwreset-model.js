/*
*   CRUD API for password reset requests
*/

var request = require('request');

var config = require('../../config/config'),
    util   = require('../../app/shared/util');

/*
*   Adds a new password reset request
*/
exports.addRequest = function(user_id, callback) {
    var request = {
        user_id: user_id,
        token: util.createGUID(),
        created_at: new Date()
    };

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'pw_reset', function (err, collection) {
        collection.save(request, {w: 1}, function (err, result) {
            if (err) {
                callback(err, null);
            }
            else {
                callback(null, result.ops[0]);
            }
        });
    });
}

/*
*   Find password reset request by token
*/
exports.findByToken = function(token, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'pw_reset', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { token: token }, function (err, item) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, item);
                }
            });
        }
    });
}