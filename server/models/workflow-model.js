/*
*   CRUD API for workflows
*/

var ObjectID = require('mongodb').ObjectID;

var config = require('../../config/config'),
    util   = require('../../app/shared/util');

/*
*   Upserts a record and returns the resulting record
*/
exports.saveWorkflow = function(model, callback) {

    // sometimes id is native, sometimes it's been converted to a string
    if (model._id && _.isString(model._id)) {
        model._id = new ObjectID.createFromHexString(model._id);
    }

    // set last updated
    model.last_updated_at = new Date();

    // set created at
    if (!model.created_at) {
        model.created_at = model.last_updated_at;
    }
    else {
        model.created_at = new Date(model.created_at);
    }

    // create friendly name for things like log messages
    model.friendly_name = util.capitalizeFirstWord(model.type) + '/' + util.capitalizeFirstWord(model.partner) + ' - ' + model.action.description;
    if (model.action.id === 'add-to-list') {
        model.friendly_name += ': ' + model.action.meta.list.name;
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'workflow', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.save(model, function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err, null);
                }
                else {
                    callback(null, model);
                }
            });
        }
    });
}

/*
*   Get all workflows for an account
*/
exports.getByAccount = function(accountId, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'workflow', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find( {account_id: accountId, deleted: false } ).sort({enabled: -1, created_at: -1}).toArray(function (err, items) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (items) {
                        callback(null, items);
                    }
                    else {
                        callback(null, null);
                    }
                }
            });
        }
    });
}

/*
*   Gets a single workflow record by account id and workflow id
*/
exports.getById = function(accountId, workflowId, callback) {

    // sometimes id is native, sometimes it's been converted to a string
    if (_.isString(workflowId)) {
        workflowId = new ObjectID.createFromHexString(workflowId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'workflow', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( {_id: workflowId, account_id: accountId }, function (err, item) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (item) {
                        callback(null, item);
                    }
                    else {
                        callback(null, null);
                    }
                }
            });
        }
    });
}
