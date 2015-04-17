/*
*   Forward emails to accounts that have configured forwarding
*/

var async = require('async');

var account       = require('../server/models/account-model'),
    inboundEmail  = require('../server/models/inboundemail-model'),
    emailDetail   = require('../server/models/emaildetail-model'),
    mail          = require('../server/models/mail-model'),
    util          = require('../app/shared/util');

exports.runJob = function(callback) {
    var finished = false;
    var humanCount = 0;
    var allCount = 0;

    async.doUntil(
        function (callback_inner) {
            inboundEmail.forwardSingleEmail(function (err, raw_email) {
                if (err || raw_email == null) {
                    finished = true;
                    callback_inner(null);
                }
                else {
                    emailDetail.findByRawId(raw_email._id, function (err, email) {
                        if (err) {
                            // set status on inbound_email to 901
                            logger.error(err);
                            inboundEmail.setStatus(raw_email._id, 901, function (err, doc) {
                                if (err) {
                                    logger.error('Error setting status on inbound_email: ' + err);
                                }
                                callback_inner(null);
                            });
                        }
                        else {
                            account.findById(email.account_id.toString(), function (err, account) {
                                if (err) {
                                    // set status on inbound_email to 901
                                    inboundEmail.setStatus(raw_email._id, 901, function (err, doc) {
                                        if (err) {
                                            logger.error('Error setting status on inbound_email: ' + err);
                                        }
                                        callback_inner(null);
                                    });
                                }
                                else {
                                    // all should be good - start the forwarding process
                                    var sendTo = [];
                                    if (email.type == 'human') {
                                        sendTo = util.dedupStringArray(account.forwards.human.concat(account.forwards.all));
                                    }
                                    else {
                                        sendTo = account.forwards.all;
                                    }

                                    if (sendTo.length > 0) {
                                        mail.forwardMail(raw_email, email, sendTo, function (err) {
                                            if (err) {
                                                inboundEmail.setStatus(raw_email._id, 901, function (err, doc) {
                                                    if (err) {
                                                        logger.error('Error setting status on inbound_email: ' + err);
                                                    }
                                                    callback_inner(null);
                                                });
                                            }
                                            else {
                                                inboundEmail.setStatus(raw_email._id, 5, function (err, doc) {
                                                    if (err) {
                                                        logger.error('Error setting status on inbound_email: ' + err);
                                                    }

                                                    // just some tracking and logging
                                                    if (email.type == 'human') {
                                                        humanCount++;
                                                    }
                                                    else {
                                                        allCount ++;
                                                    }
                                                    callback_inner(null);
                                                });
                                            }
                                        });
                                    }
                                    else {
                                        logger.info('No forward addresses configured for account: ' + account.name + '. Not forwarding from ' + raw_email.from[0].address);
                                        inboundEmail.setStatus(raw_email._id, 5, function (err, doc) {
                                            if (err) {
                                                logger.error('Error setting status on inbound_email: ' + err);
                                            }
                                            callback_inner(null);
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            });
        },
        function() {
            // tells async.doUntil when to stop running
            return finished;
        },
        function (err) {
            logger.info('Finished processing mail forwards: ' + humanCount + ' human email(s), ' + allCount + ' all email(s)');
            callback();
        }
    );
}

