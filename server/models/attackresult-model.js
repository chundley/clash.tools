/*
*   CRUD API for Attack results
*/

var ObjectID = require('mongodb').ObjectID,
    async    = require('async'),
    _        = require('underscore');

var config    = require('../../config/config');

var fib = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];
var starVal = [0, 10, 30, 60];

/*
* Upserts a record and returns the record
*/
exports.save = function(warId, model, callback) {
    if (_.isString(warId)) {
        warId = new ObjectID.createFromHexString(warId);
    }

    if (_.isString(model.u)) {
        model.u = new ObjectID.createFromHexString(model.u);
    }

    if (_.isString(model.c)) {
        model.c = new ObjectID.createFromHexString(model.c);
    }

    var rank = model.pIndex + 1;
    var opponentRank = model.bIndex + 1;
    model.we = new Date(model.we);

    var fibIdx = rank - opponentRank;
    var fibVal = 377;

    var attackValue = starVal[model.stars];

    if (fibIdx >= 0) {
        if (fibIdx < 12) {
            attackValue += Math.sqrt(fib[fibIdx]) * 3;
        }
        else {
            attackValue += 50;
        }
    }
    else {
        fibIdx = fibIdx * -1;
        if (fibIdx < 8) {
            attackValue -= Math.sqrt(fib[fibIdx]) * 2;
        }
        else {
            // max attack deduction = 20
            attackValue -= 20;
        }
    }

    //var attackValue = 

    logger.warn(model);
    logger.error(attackValue);

    // determine if this record exists already

    async.waterfall([
        function (callback_wf) {
            db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'attack_result', function (err, collection) {
                if (err) {
                    callback(err, null);
                }
                else {
                    collection.findOne( { w: warId, u: model.u, r: rank, or: opponentRank }, function (err, item) {
                        if (err) {
                            callback_wf(err, null);
                        }
                        else {
                            callback_wf(null, item);
                        }
                    });
                }
            });
        },
        function (attackResult, callback_wf) {
            if (attackResult == null) {
                // not updating an existing attack result - add new

            }
            logger.warn(attackResult);
        }
    ], function (err, result) {
        if (err) {
            callback(err, null);
        }
        else {
            callback(null, result);
        }
    });



    callback(null, null);

/*
    model.last_updated_at = new Date();

    if (model.created_at) {
        model.created_at = new Date(model.created_at);
    }
    else {
        model.created_at = model.last_updated_at;
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'war', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.save(model, function (err, war) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (war == 1) { // successful update
                        callback(null, model);
                    }
                    else {  // successful save new
                        callback(null, war);
                    }
                }
            });
        }
    });*/

}
