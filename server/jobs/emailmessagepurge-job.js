/*
*   Purge email job
*/

var config 				= require('../../config/config'),
    emailMessageModel   = require('../models/emailmessage-model');

exports.runJob = function(numDays, callback) {
    emailMessageModel.purge(numDays, function (err, results) {
    	if (err) {
    		logger.error('Error in email message purge: ' + err);
    	}
    	else {
    		logger.info('Email purge job completed. Deleted [' + results + '] emails from email_message');
    	}
    	callback();
    });
}
