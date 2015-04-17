/*
*   Email detail endpoints
*/

var emailDetailModel = require('../models/emaildetail-model'),
    inboundEmailModel = require('../models/inboundemail-model');



/*
*   Get total email count by account id
*/
exports.countByAccountId = function(req, res, next) {
    emailDetailModel.countByAccountId(req.params.id, JSON.parse(req.query.filters), function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else if (result) {
            res.json(200,  { count: result } );
        }
        else {
            // in this case we want the client to know there were zero found for null state
            res.send(200, { count: 0 } );
        }
    });
};

/*
*   Get email details by account id (paginated results)
*/
exports.findByAccountId = function(req, res, next) {
    emailDetailModel.findByAccountId(req.params.id, parseInt(req.query.pagesize), parseInt(req.query.pagedelta), JSON.parse(req.query.filters), function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else if (result) {
            res.json(200, result);
        }
        else {
            res.json(404, 'not found');
        }
    });
};

/*
*   Find a single email detail, including the raw email record
*/
exports.findDetailAndRawById = function(req, res, next) {
    emailDetailModel.findById(req.params.account_id, req.params.email_id, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else if (result) {
            inboundEmailModel.findById(result.raw_id, function (err, inbound) {
                if (err) {
                    res.send(500, err);
                }
                else if (inbound) {
                    result.raw = inbound;
                    res.json(200, result);
                }
                else {
                    res.json(404, 'not found');
                }
            });
        }
        else {
            res.send(404, 'not found');
        }
    });
}

/*
*   Get total email count by account id
*/
exports.setHidden = function(req, res, next) {
    emailDetailModel.setHidden(req.params.email_id, function (err, result) {
        if (err) {
            res.send(500, err);
        }
        else if (result) {
            res.json(200,  { records: result });
        }
        else {
            res.send(404, 'not found');
        }
    });
};
