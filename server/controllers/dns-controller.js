/*
*   DNS endpoints
*/

var model  = require('../models/dns-model'),
    config = require('../../config/config');

/*
*   Gets MX records for a domain. It also includes the configured
*   mail exchange host for Siftrock for comparison
*/
exports.getMXRecords = function(req, res, next) {
    model.getMXRecords(req.params.domain, function (err, records) {
        if (err) {
            res.send(500, err);
        }
        else {
            var ret = {
                mx_config: config.env[process.env.NODE_ENV].mxRecord,
                records: records
            };
            res.json(200, ret);
        }
    });
};
