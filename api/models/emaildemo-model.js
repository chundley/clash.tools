/*
*   CRUD for email demo
*/
var config = require('../../config/config');

exports.findByAddress = function(address, callback) {
    var fullAddress = address + '@' + config.demoDomain;
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_demo', function (err, collection) {
        collection.findOne( { system_to_address: fullAddress}, function (err, result) {
            if (err) {
                callback(err, null);
            }
            else {
                if (result) {
                    callback(null, result);
                }
                else {
                    callback(null, null);
                }
            }
        });
    });
}
