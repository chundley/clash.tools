/*
*   CRUD API for inbound emails
*/


var ObjectID = require('mongodb').ObjectID;

var config = require('../../config/config')

exports.findById = function(id, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'inbound_email', function (err, collection) {
        collection.findOne( { _id: id }, function (err, result) {
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

/*
*   Gets an email that needs to be forwarded and sets status to 4 (forward started)
*/
exports.forwardSingleEmail = function(callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'inbound_email', function (err, collection) {
        collection.findAndModify(
            { status: 3 },
            [ ['created_at', 'asc'] ],
            { $set: { status: 4 } },
            { upsert: false },
            function (err, doc) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, doc);
                }
            }
        );
    });
}

/*
*   Set the status of a single email
*/
exports.setStatus = function(id, status, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'inbound_email', function (err, collection) {
        collection.update(
            { _id: id },
            { $set: { status: status } },
            { upsert: false },
            function (err, doc) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, doc);
                }
            }
        );
    });
}
