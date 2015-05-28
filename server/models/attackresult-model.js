/*
*   CRUD API for Attack results
*/

var ObjectID = require('mongodb').ObjectID,
    async    = require('async'),
    _        = require('underscore');

var config    = require('../../config/config'),
    warModel  = require('./war-model');

// baseline value for stars
var starVal = [0, 10, 30, 60];

// baseline inversed
var starValInversed = [0, 60, 30, 10];

// fibonacci sequence for distance from mirror
var fib = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];

// max extra points given for attacking higher (by stars)
var maxFibHigh = [0, 12, 24, 36];

// max points deducted for attacking lower (by stars)
var maxFibLow = [0, 36, 24, 12];

// wars broken up into 10 bands, points added for hitting specific bands
var rankBands = [16, 12, 10, 8, 6, 4, 3, 2, 1, 0];

// bonus applied if it was the first attack
var firstAttackBonus = [0, 1, 3, 8];

/*
* Upserts a record and returns the record
*/
exports.save = function(warId, model, callback) {
    if (_.isString(warId)) {
        warId = new ObjectID.createFromHexString(warId);
    }

    //NOTE: can't save model.u as a native Object because the temp users have a GUID
/*    if (_.isString(model.u)) {
        try {
            model.u = new ObjectID.createFromHexString(model.u);
        }
        catch (e) {
            logger.error(model.u);
            logger.warn(e);
        }
    }*/

    if (_.isString(model.c)) {
        model.c = new ObjectID.createFromHexString(model.c);
    }

    var rank = model.pIndex + 1;
    var opponentRank = model.bIndex + 1;
    model.we = new Date(model.we);

    var fibIdx = rank - opponentRank;

    // baseline attack value is number of stars
    var attackValue = starVal[model.stars];

    // added or subtracted value based on position of base attacked in lineup compared to attacker
    if (fibIdx >= 0) {
        if (fibIdx < 12) {
            attackValue += Math.sqrt(fib[fibIdx]) * model.stars;
        }
        else {
            attackValue += maxFibHigh[model.stars];
        }
    }
    else {
        fibIdx = fibIdx * -1;
        if (fibIdx < 12) {
            attackValue -= Math.sqrt(fib[fibIdx]) * (4 - model.stars);
        }
        else {
            // max attack deduction = 30
            attackValue -= maxFibLow[model.stars];
        }
    }

    // added or subtracted value based on attacking a higher or lower TH level
    if (model.t < model.ot) {
        attackValue += starVal[model.stars] * .30;
    }
    else if (model.t > model.ot) {
        attackValue -= starValInversed[model.stars] * .30;
    }

    // max is 150
    if (attackValue > 150) {
        attackValue = 150;
    }
    // min is 0
    else if (attackValue < 0) {
        attackValue = 0;
    }

    // final check - zero stars is always worth zero (the above factors could make a zero attack worth points)
    if (model.stars == 0) {
        attackValue = 0;
    }

    // determine if this record exists already

    async.waterfall([
        function (callback_wf) {
            // need the war for some parts of scoring
            warModel.findById(warId, function (err, war) {
                if (err) {
                    callback_wf(err, null);
                }
                else {
                    callback_wf(null, war);
                }
            });
        },
        function (war, callback_wf) {
            db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'attack_result', function (err, collection) {
                if (err) {
                    callback_wf(err, null);
                }
                else {
                    collection.findOne( { w: warId, u: model.u, r: rank, or: opponentRank }, function (err, item) {
                        if (err) {
                            callback_wf(err, null);
                        }
                        else {
                            callback_wf(null, war, item);
                        }
                    });
                }
            });
        },
        function (war, attackResult, callback_wf) {

            // before updating, use the war context for additional scoring value

            var bandSize = parseInt(war.player_count / 10);

            // figure out rankBonus based on banding
            var rankRange = opponentRank / bandSize;
            var rankBonus = 0;

            if (rankRange <= 1) {
                rankBonus = rankBands[0];
            }
            else if (rankRange <= 2) {
                rankBonus = rankBands[1];
            }
            else if (rankRange <= 3) {
                rankBonus = rankBands[2];
            }
            else if (rankRange <= 4) {
                rankBonus = rankBands[3];
            }
            else if (rankRange <= 5) {
                rankBonus = rankBands[4];
            }
            else if (rankRange <= 6) {
                rankBonus = rankBands[5];
            }
            else if (rankRange <= 7) {
                rankBonus = rankBands[6];
            }
            else if (rankRange <= 8) {
                rankBonus = rankBands[7];
            }
            else if (rankRange <= 9) {
                rankBonus = rankBands[8];
            }

            // apply star credit on rankBonus
            rankBonus = parseInt(rankBonus*model.stars/3);
            attackValue += rankBonus;

            // apply first attack bonus
            if (war.bases[opponentRank - 1].a[0].u == model.u) {
                // if the first item in the attack array is this user, assume it was the first attack
                attackValue += firstAttackBonus[model.stars];
            }

            if (attackResult == null) {
                // not updating an existing attack result - add new
                var newAR = {
                    u: model.u,
                    i: model.i,
                    c: model.c,
                    cn: model.cn,
                    w: warId,
                    we: model.we,
                    r: rank,
                    or: opponentRank,
                    t: model.t,
                    ot: model.ot,
                    s: model.stars,
                    v: parseInt(attackValue)
                };

                db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'attack_result', function (err, collection) {
                    if (err) {
                        callback_wf(err, null);
                    }
                    else {
                        collection.save(newAR, function (err, ar) {
                            if (err) {
                                callback_wf(err, null);
                            }
                            else {
                                callback_wf(null, ar);
                            }
                        });
                    }
                });
            }
            else {
                // update existing
                var update = {
                    $set: {
                        s: model.stars,
                        v: parseInt(attackValue)
                    }
                };

                db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'attack_result', function (err, collection) {
                    if (err) {
                        callback_wf(err, null);
                    }
                    else {
                        collection.update({ w: warId, u: model.u, or: opponentRank }, update, function (err, ar) {
                            if (err) {
                                callback_wf(err, null);
                            }
                            else {
                                callback_wf(null, ar);
                            }
                        });
                    }
                });
            }
        }
    ], function (err, result) {
        if (err) {
            callback(err, null);
        }
        else {
            callback(null, result);
        }
    });

}

/*
*   Remove a row from attack_result - should rarely be needed
*/
exports.remove = function(warId, model, callback) {
    if (_.isString(warId)) {
        warId = new ObjectID.createFromHexString(warId);
    }

    if (_.isString(model.u)) {
        model.u = new ObjectID.createFromHexString(model.u);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'attack_result', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            //var opponentRank = model.bIndex + 1;
            collection.remove({ w: warId, u: model.u, or: model.bIndex + 1 }, {}, function (err, result) {
                if (err) {
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
*   Get war results by clan id
*/
exports.findByClanId = function(clanId, callback) {
    if (_.isString(clanId)) {
        clanId = new ObjectID.createFromHexString(clanId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'attack_result', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find( { c: clanId }).toArray(function (err, items) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, items);
                }
            });
        }
    });
}

/*
*   Get war results by war id
*/
exports.findByWarId = function(warId, callback) {
    if (_.isString(warId)) {
        warId = new ObjectID.createFromHexString(warId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'attack_result', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find( { w: warId }).toArray(function (err, items) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, items);
                }
            });
        }
    });
}
