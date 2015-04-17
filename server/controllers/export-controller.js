/*
*   CSV export endpoints
*/

var _ = require('underscore');

var emailDetailModel = require('../models/emaildetail-model');


exports.allNames = function(req, res, next) {
    emailDetailModel.exportByAccountId(req.params.id, JSON.parse(req.query.filters), function (err, emails) {
        if (err) {
            res.send(500, err);
        }
        else {
            var output = 'Date,Type,Subject,New Name,New Email,New Phone,Original Recipient Name,Original Recipient Email\n';

            var d = new Date();
            var dateStr = '';
            _.each(emails, function (email) {
                _.each(email.people, function (name) {
                    d = new Date(email.date);
                    dateStr = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
                    logger.error(d);
                    logger.warn(dateStr);
                    output += '' +
                        dateStr + ',"' +
                        email.type + '","' +
                        email.subject + '","' +
                        name.name + '","' +
                        name.email_address + '","' +
                        name.phone_number + '","' +
                        email.from_name + '","' +
                        email.from_address + '"\n';
                });
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader("Content-Disposition", "attachment; filename=siftrock-names.csv");
            res.send(output);
        }
    });

}
