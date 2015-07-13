/*
*   Purge email job
*/

var config 			= require('../../config/config'),
    messageLogModel = require('../models/messagelog-model');

exports.runJob = function(numDays, callback) {
    messageLogModel.purge(numDays, function (err, results) {
    	if (err) {
    		logger.error('Error in message log purge: ' + err);
    	}
    	else {
    		logger.info('Message log purge job completed. Deleted [' + results + '] messages from message_log');
    	}
    	callback();
    });
}
