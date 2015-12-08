/*
*   CRUD API for Attack results
*/

var ObjectID = require('mongodb').ObjectID,
    async    = require('async'),
    _        = require('underscore');

var warModel  = require('./war-model');

// baseline value for stars
var starVal = [0, 10, 30, 60];

// baseline inversed
var starValInversed = [0, 60, 30, 10];

// fibonacci sequence for distance from mirror
//var fib = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];

// based on fibonacci sequence, number of points (by stars) added
var fib = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 4, 5],
            [0, 1, 1, 1, 1, 2, 2, 3, 4, 5, 6, 8, 10],
            [0, 1, 1, 2, 2, 3, 4, 5, 6, 7, 9, 12, 15]
          ];

// max extra points given for attacking higher (by stars)
var maxFibHigh = [0, 5, 10, 15];

// max points deducted for attacking lower (by stars)
var maxFibLow = [0, 15, 10, 5];

// wars broken up into 10 bands, points added for hitting specific bands
var rankBands = [16, 12, 10, 8, 6, 4, 3, 2, 1, 0];

// bonus applied if it was the first attack
var firstAttackBonus = [0, 1, 3, 8];

// Bonus and penalties for getting 3, 2, 1 stars on TH higher, equal, or lower
//
//      An example showing the bonus for 3-starring (eg, TH10 3 stars TH10 gets 15 extra points)
//
//       Opponent | TH10 | TH9  | TH8
//      ----------|------|------|-----
//       TH10     |   15 |  30  |  50
//      ----------|------|------|-----
//        TH9     |   -3 |   5  |  30
//      ----------|------|------|-----
//        TH8     |   -9 |  -3  |   0

var thBonus = [  0,
                 [
                   [0, 0, 8, 16],       // TH11 one star attacked by 11, 10, 9, 8
                   [-8, 0, 0, 8],       // TH10 one star attacked by 11, 10, 9, 8
                   [-30, -16, 0, 4],    // TH9 one star attacked by 11, 10, 9, 8
                   [-50 -30, -16, 0]    // TH8 one star attacked by 11, 10, 9, 8
                 ],
                 [
                   [8, 16, 30, 50],     // TH11 two star attacked by 11, 10, 9, 8
                   [0, 4, 12, 16],      // TH10 two star attacked by 11, 10, 9, 8
                   [-16, -8, 0, 8],     // TH9 two star attacked by 11, 10, 9, 8
                   [-30, -16, -8, 0]    // TH8 two star attacked by 11, 10, 9, 8
                 ],
                 [
                   [30, 50, 100, 200],  // TH11 three star attacked by 11, 10, 9, 8
                   [0, 16, 30, 50],     // TH10 three star attacked by 11, 10, 9, 8
                   [-8, -4, 4, 16],     // TH9 three star attacked by 11, 10, 9, 8
                   [-16, -8, -4, 0]     // TH8 three star attacked by 11, 10, 9, 8
                 ]
               ];

/*
* Upserts a record and returns the record
*/
exports.save = function(warId, model, callback) {
    if (_.isString(warId)) {
        warId = new ObjectID.createFromHexString(warId);
    }

    if (_.isString(model.c)) {
        model.c = new ObjectID.createFromHexString(model.c);
    }

    var rank = model.pIndex + 1;
    var opponentRank = model.bIndex + 1;

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

            // start doing AV calculation
            var avParts = [];

            model.we = new Date(model.we);

            var bandSize = parseInt(war.player_count / 10);

            // adjust rank for top of the map - adds additional points for top bases
            var adjustedRank = rank;
            var aRankRange = rank / bandSize;

            if (aRankRange <= 1) {
                adjustedRank = (10 - (1 + rank));
            }
            else if (aRankRange <= 2 ) {
                adjustedRank = (10 - (2 + rank));
            }

            // index used for delta points
            var fibIdx = adjustedRank - opponentRank;



            // baseline attack value is number of stars
            var attackValue = starVal[model.stars];
            avParts.push( { c: 'baseStars', v: starVal[model.stars] });

            // added or subtracted value based on position of base attacked in lineup compared to attacker
            if (fibIdx >= 0) {
                if (fibIdx < 13) {
                    //attackValue += Math.sqrt(fib[fibIdx]) * model.stars;
                    attackValue += fib[model.stars][fibIdx];
                    avParts.push( { c: 'oppDelta', v: fib[model.stars][fibIdx]});
                }
                else {
                    attackValue += maxFibHigh[model.stars];
                    avParts.push( { c: 'oppDelta', v: maxFibHigh[model.stars]});
                }
            }
            else {
                fibIdx = fibIdx * -1;
                if (fibIdx < 13 && model.stars > 0) {
                    //attackValue -= Math.sqrt(fib[fibIdx]) * (4 - model.stars);
                    attackValue -= fib[4-model.stars][fibIdx];
                    avParts.push( { c: 'oppDelta', v: (fib[4-model.stars][fibIdx])*(-1)});
                }
                else {
                    // max attack deduction = 30
                    attackValue -= maxFibLow[model.stars];
                    avParts.push( { c: 'oppDelta', v: (maxFibLow[model.stars])*(-1)});
                }
            }

            // use the new way of calculating TH/TH bonuses
            if (model.stars > 0 && model.t > 7 && model.ot > 7) {
                attackValue += thBonus[model.stars][11-model.ot][11-model.t];
                avParts.push( { c: 'thDelta', v: thBonus[model.stars][11-model.ot][11-model.t] } );

            }
            else {
                // use the old defaults for TH7 and below
                if (model.t < model.ot) {
                    attackValue += parseInt(starVal[model.stars] * .50);
                    avParts.push( { c: 'thDelta', v: parseInt(starVal[model.stars] * .50)});
                }
                else if (model.t > model.ot) {
                    attackValue -= parseInt(starValInversed[model.stars] * .30);
                    avParts.push( { c: 'thDelta', v: parseInt(starValInversed[model.stars] * (-.30))});
                }
            }


            // before updating, use the war context for additional scoring value


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
            avParts.push( { c: 'rankBonus', v: rankBonus });

            // apply first attack bonus
            if (war.bases[opponentRank - 1].a[0].u == model.u) {
                // if the first item in the attack array is this user, assume it was the first attack
                attackValue += firstAttackBonus[model.stars];
                avParts.push( { c: 'firstAttack', v: firstAttackBonus[model.stars] });
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

            if (attackResult == null) {
                // not updating an existing attack result - add new
                var newAR = {
                    u: model.u,
                    i: model.i,
                    c: model.c,
                    cn: model.cn,
                    on: model.on,
                    w: warId,
                    we: model.we,
                    r: rank,
                    ar: adjustedRank,
                    or: opponentRank,
                    t: model.t,
                    ot: model.ot,
                    s: model.stars,
                    v: parseInt(attackValue),
                    av_parts: avParts
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
                        v: parseInt(attackValue),
                        av_parts: avParts
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

    // removing this - uid's can be temporary GUID's
    /*
    if (_.isString(model.u)) {
        model.u = new ObjectID.createFromHexString(model.u);
    }*/

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'attack_result', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
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

exports.findByUserId = function(userId, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'attack_result', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find( { u: userId }).toArray(function (err, items) {
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
*   Deletes all attack results for a war
*/
exports.deleteWar = function(warId, callback) {
    if (_.isString(warId)) {
        warId = new ObjectID.createFromHexString(warId);
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'attack_result', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.remove( { w: warId }, function (err, count) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, count);
                }
            });
        }
    });
}
