/*
*   CRUD API for email detail
*/

var ObjectID = require('mongodb').ObjectID;

var config = require('../../config/config');

exports.countByAccountId = function(account_id, filters, callback) {

    // date range
    var endDT = new Date();
    var startDT = new Date();
    startDT.setTime(startDT.getTime() - (filters.days*24*60*60*1000));
    var type = filters.type.toLowerCase();

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            var whereClause = {
                account_id: ObjectID.createFromHexString(account_id),
                date: { $gte: startDT },
                hidden: false
            };

            if (type != 'all') {
                whereClause.type = type;
            }

            if (filters.recipient.length > 0) {
                whereClause.$or = [
                    { from_address: { $regex: filters.recipient } },
                    { from_name: { $regex: filters.recipient } }
                ];
            }

            collection.count(
                whereClause, function (err, result) {
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
        }
    });
}

/*
*   Base method for retrieving filtered, paginated results into the stream view. There are three
*   use cases, each covered by a sub method for easier code refactoring.
*
*   There is some complexity in paginating by email_detail.date since the values aren't unique. A
*   secondary unique column is needed as part of the where clause and sort to ensure values aren't
*   duplicated (using gte or lte) or skipped (using gt or lt).
*/
exports.findByAccountId = function(account_id, pagesize, page_delta, filters, callback) {
    // date range
    var endDT = new Date();
    var startDT = new Date();
    startDT.setTime(startDT.getTime() - (filters.days*24*60*60*1000));
    var type = filters.type.toLowerCase();

    if (filters.first_date != 0) {
        if (page_delta > 0) {
            // Use Case: going forward N pages, eg on page 3, navigating to page 4
            paginateForward(account_id, pagesize, page_delta, filters, function (err, results) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, results);
                }
            });
        }
        else if (page_delta == 0) {
            // Use Case: staying on the same page, an email was hidden and data needs to be refreshed
            paginateStay(account_id, pagesize, page_delta, filters, function (err, results) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, results);
                }
            });
        }
        else {
            // Use Case: going back N pages, eg on page 10, navigating to page 8
            paginateBack(account_id, pagesize, page_delta, filters, function (err, results) {
                if (err) {
                    callback(err, null);
                }
                else {
                    callback(null, results);
                }
            });
        }
    }
    else {
        // Use Case: initial page load, eg page 1 refresh
        paginateForward(account_id, pagesize, page_delta, filters, function (err, results) {
            if (err) {
                callback(err, null);
            }
            else {
                callback(null, results);
            }
        });
    }
}

/*
*   Queries for records when paginating forward, eg. from page 3 to 4
*/
function paginateForward(accountId, pageSize, pageDelta, filters, callback) {
    // Take care of a few edge cases and set up query values

    // most likely initial page load - setting this will load the first N records
    if (pageDelta == 0) {
        pageDelta = 1;
    }

    // initial page load - just set an arbitrary date
    if (filters.last_date == 0) {
        filters.last_date = new Date();
    }

    var startDT = new Date();
    startDT.setTime(startDT.getTime() - (filters.days*24*60*60*1000));
    var type = filters.type.toLowerCase();

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            var whereClause = {
                account_id: ObjectID.createFromHexString(accountId),
                date: {
                    $gte: startDT,
                    $lt: new Date(filters.last_date)
                },
                hidden: false
            };

            if (type != 'all') {
                whereClause.type = type;
            }

            // some complexity here due to pagination by date which can have duplicates
            //whereClause.$and = [{1:1}];
            if (filters.last_id) {
                whereClause.$and = [
                    {
                        $or: [
                                {
                                    date: filters.last_date,
                                    _id: { $lt: ObjectID.createFromHexString(filters.last_id) }
                                },
                                {
                                    date: { $lte: new Date(filters.last_date) }
                                }
                        ]
                    }
                ];
            }


            if (filters.recipient.length > 0) {
                if (whereClause.$and) {
                    whereClause.$and.push(
                        {
                            $or: [
                                { from_address: { $regex: filters.recipient } },
                                { from_name: { $regex: filters.recipient } }
                            ]
                        }
                    );
                }
                else {
                    whereClause.$and = [
                        {
                            $or: [
                                { from_address: { $regex: filters.recipient } },
                                { from_name: { $regex: filters.recipient } }
                            ]
                        }
                    ];
                }
            }

            collection.find(
                whereClause,
                {}
            )
            .skip(
                ((pageDelta-1) * pageSize)
            )
            .sort(
                {date: -1, _id: -1}
            )
            .limit(pageSize)
            .toArray(function (err, result) {
                if (err) {
                    logger.error(err);
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
        }
    });
}

/*
*   Queries for records when paginating backward, eg. from page 3 to 2
*/
function paginateBack(accountId, pageSize, pageDelta, filters, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            var startDT = new Date();
            startDT.setTime(startDT.getTime() - (filters.days*24*60*60*1000));
            var type = filters.type.toLowerCase();

            var whereClause = {
                account_id: ObjectID.createFromHexString(accountId),
                date: {
                    $gte: startDT,
                },
                hidden: false
            };

            if (type != 'all') {
                whereClause.type = type;
            }

            // some complexity here due to pagination by date which can have duplicates
            whereClause.$and = [
                {
                    $or: [
                            {
                                date: filters.last_date,
                                _id: { $gt: ObjectID.createFromHexString(filters.last_id) }
                            },
                            {
                                date: { $gte: new Date(filters.last_date) }
                            }
                    ]
                }
            ];

            if (filters.recipient.length > 0) {
                whereClause.$and.push(
                    {
                        $or: [
                            { from_address: { $regex: filters.recipient } },
                            { from_name: { $regex: filters.recipient } }
                        ]
                    }
                );
            }

            pageDelta = pageDelta * -1;
            collection.find(
                whereClause,
                {}
            )
            .skip(
                (pageDelta * pageSize)
            )
            .sort(
                {date: 1, _id: 1}
            )
            .limit(pageSize)
            .toArray(function (err, result) {
                if (err) {
                    logger.error(err);
                    callback(err, null);
                }
                else {
                    if (result) {
                        // need to reverse the sort since it's ascending on this version
                        callback(null, result.reverse());
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
*   Queries for records when staying on the same page, but hiding a record
*/
function paginateStay(accountId, pageSize, pageDelta, filters, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            var startDT = new Date();
            startDT.setTime(startDT.getTime() - (filters.days*24*60*60*1000));
            var type = filters.type.toLowerCase();

            var whereClause = {
                account_id: ObjectID.createFromHexString(accountId),
                date: {
                    $gte: startDT,
                    $lte: new Date(filters.first_date)
                },
                hidden: false
            };

            if (type != 'all') {
                whereClause.type = type;
            }

            if (filters.recipient.length > 0) {
                whereClause.$or = [
                    { from_address: { $regex: filters.recipient } },
                    { from_name: { $regex: filters.recipient } }
                ];
            }

            collection.find(
                whereClause,
                {}
            )
            .sort(
                {date: -1, _id: -1}
            )
            .limit(pageSize)
            .toArray(function (err, result) {
                if (err) {
                    logger.error(err);
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
        }
    });
}

exports.exportByAccountId = function(account_id, filters, callback) {
    var endDT = new Date();
    var startDT = new Date();
    startDT.setTime(startDT.getTime() - (filters.days*24*60*60*1000));
    var type = filters.type.toLowerCase();

    var whereClause = {
        account_id: ObjectID.createFromHexString(account_id),
        date: { $gte: startDT },
        hidden: false
    };

    if (type != 'all') {
        whereClause.type = type;
    }

    if (filters.recipient.length > 0) {
        whereClause.$or = [
            { from_address: { $regex: filters.recipient } },
            { from_name: { $regex: filters.recipient } }
        ];
    }

    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.find(
                whereClause,
                {}
            ).sort({date: -1}).toArray(function (err, result) {
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
        }
    });
}

exports.findById = function(account_id, email_id, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { _id: ObjectID.createFromHexString(email_id), account_id: ObjectID.createFromHexString(account_id)}, function (err, result) {
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
        }
    });
}

exports.findByRawId = function(raw_id, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null);
        }
        else {
            collection.findOne( { raw_id: raw_id }, function (err, result) {
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
        }
    });
}

exports.setHidden = function(email_id, callback) {
    db(config.env[process.env.NODE_ENV].mongoDb.dbName, 'email_detail', function (err, collection) {
        if (err) {
            callback(err, null)
        }
        else {
            collection.update(
                { _id: ObjectID.createFromHexString(email_id) },
                { $set: { hidden: true } },
                { upsert: false },
                function (err, result) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        callback(null, result);
                    }
                }
            );
        }
    });
}
