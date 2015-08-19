/*
*   Send an email to all users in the system
*/

var async = require('async'),
    fs    = require('fs'),
    _     = require('underscore');

var config    = require('../../config/config'),
    userModel = require('../models/user-model'),
    mailModel = require('../models/mail-model'),
    templatePath = './server/email_templates/updates/';

exports.runJob = function(callback) {
    getContent(function (err, html, text) {
        if (err) {
            callback(err);
        }
        else {
            if (html) {
                userModel.allUsersValidEmail(function (err, users) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        var q = async.queue(function (user, callback_q) {
                            mailModel.cannedMail(user.email_address, user.ign, 'Clash.tools monthly newsletter', html, text, function (err) {
                                if (err) {
                                    callback_q(err);
                                }
                                else {
                                    callback_q(null);
                                }
                            });
                        });

                        q.drain = function() {
                            logger.info('User queue has been processed');
                        }

                        q.push(users, function (err) {
                            if (err) {
                                logger.error(err);
                            }
                        });
                    }
                });
            }
        }
    });
}


function getContent(callback) {
    var contentHtml = null;
    var contentText = null;
    var files = fs.readdirSync(templatePath);
    _.each(files, function (file) {
        if (file.indexOf('all-') >= 0 && file.indexOf('.html') >= 0) {
            // this is a file to process
            contentHtml = fs.readFileSync(templatePath + file, 'utf8');
        }
        else if (file.indexOf('all-') >= 0 && file.indexOf('.txt') >= 0) {
            contentText = fs.readFileSync(templatePath + file, 'utf8');
        }
    });

    callback(null, contentHtml, contentText);
}