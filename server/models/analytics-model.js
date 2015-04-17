/*
*   Analytics model
*/

var ObjectID = require('mongodb').ObjectID,
    _        = require('underscore');

var config = require('../../config/config'),
    util   = require('../../app/shared/util');


exports.summary = function(accountId, numDays, callback) {
    var start = new Date();
    start.setDate(start.getDate() - numDays + 1);

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find(
                {
                    account_id: ObjectID.createFromHexString(accountId),
                    date: { $gte: start },
                    hidden: false
                },
                { people: 1 }
            ).toArray(function (err, result) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (result) {
                        var ret = {
                            total_replies: 0,
                            total_names: 0,
                            total_email_addresses: 0,
                            total_phone_numbers:0
                        };

                        _.each(result, function (row) {
                            ret.total_replies++;
                            _.each(row.people, function (person) {
                                if (!person.sender) {
                                    ret.total_names++;
                                    if (person.email_address.length > 0) {
                                        ret.total_email_addresses++;
                                    }
                                    if (person.phone_number.length > 0) {
                                        ret.total_phone_numbers++;
                                    }
                                }
                            });
                        });
                        callback(null, ret);
                    }
                    else {
                        callback(null, null);
                    }
                }
            });
        }
    });
}

exports.emailCountByDay = function(account_id, num_days, callback) {
    var end = new Date();
    var start = new Date();
    start.setDate(start.getDate() - num_days + 1);
    var range = util.initDateRangeData(start, end);

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.aggregate([
                {
                    $match: {
                        account_id: ObjectID.createFromHexString(account_id),
                        date: { $gte: start },
                        hidden: false
                    }
                },
                {
                    $group: {
                        _id: {
                            date: {
                                month: { $month: "$date" },
                                day: { $dayOfMonth: "$date" },
                                year: { $year: "$date"}
                            }
                        },
                        count: { $sum: 1 }
                    }
                }
            ],
            function (err, result) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (result) {
                        _.each(result, function (row) {
                            var tempDate = row._id.date.year + '/' + row._id.date.month + '/' + row._id.date.day;
                            _.each(range, function (item) {
                                if (item.date == tempDate) {
                                    item.count = row.count;
                                }
                            });
                        });

                        // if num_days > 90 then cut off data so the "All" filter doesn't go back so far
                        var firstDataIdx = 0
                        if (num_days > 90) {
                            for (var idx=0; idx<range.length; idx++) {
                                if (range[idx].count > 0) {
                                    firstDataIdx = idx;
                                    break;
                                }
                            }
                        }

                        if (range.length - firstDataIdx + 1 < 90) {
                            // if the subset with data has less than 90 values, return 90 days anyway
                            range = range.slice(range.length-91, range.length-1);
                        }
                        else {
                            // subset of array that actually has data
                            range = range.slice(firstDataIdx, range.length-1);
                        }


                        callback(null, range);
                    }
                    else {
                        callback(null, range);
                    }
                }
            });
        }
    });
}

exports.emailCountByType = function(account_id, num_days, callback) {
    var start = new Date();
    start.setDate(start.getDate() - num_days + 1);

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.aggregate([
                {
                    $match: {
                        account_id: ObjectID.createFromHexString(account_id),
                        date: { $gte: start },
                        hidden: false
                    }
                },
                {
                    $group: {
                        _id: {
                            type: '$type'
                        },
                        count: { $sum: 1 }
                    }
                }
            ],
            function (err, result) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (result) {
                        var ret = [];
                        _.each(result, function (row) {
                            ret.push({
                                type: row._id.type,
                                count: row.count
                            });
                        });

                        callback(null, ret);
                    }
                    else {
                        callback(null, null);
                    }
                }
            });
        }
    });
}

exports.personCountByType = function(account_id, num_days, callback) {
    var start = new Date();
    start.setDate(start.getDate() - num_days + 1);

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.aggregate([
                {
                    $match: {
                        account_id: ObjectID.createFromHexString(account_id),
                        date: { $gte: start },
                        hidden: false
                    }
                },
                {
                    $unwind: '$people'
                },
                {
                    $group: {
                        _id: {
                            type: '$type',
                            sender: '$people.sender'
                        },
                        count: { $sum: 1 }
                    }
                }
            ],
            function (err, result) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (result) {
                        var ret = [];
                        _.each(result, function (row) {
                            ret.push({
                                type: row._id.type,
                                sender: row._id.sender,
                                count: row.count
                            });
                        });

                        callback(null, ret);
                    }
                    else {
                        callback(null, null);
                    }
                }
            });
        }
    });
}

exports.allPeople = function(account_id, num_days, callback) {
    var start = new Date();
    start.setDate(start.getDate() - num_days + 1);

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find(
                {
                    account_id: ObjectID.createFromHexString(account_id),
                    date: { $gte: start },
                    hidden: false
                },
                { people: 1 }
            ).toArray(function (err, result) {
                if (err) {
                    callback(err, null);
                }
                else {
                    if (result) {
                        var ret = [];
                        _.each(result, function (row) {
                            ret = ret.concat(row.people);
                        });
                        callback(null, ret);
                    }
                    else {
                        callback(null, null);
                    }
                }
            });
        }
    });
}
