/*
*   Send an email to all users in the system
*/

var async = require('async'),
    fs    = require('fs'),
    _     = require('underscore');

var userModel = require('../models/user-model'),
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
                    else if (users.length > 0) {
                        var q = async.queue(function (user, callback_q) {
                            mailModel.cannedMail(user.email_address, user.ign, 'Update from clash.tools', html, text, function (err) {
                                if (err) {
                                    callback_q(err);
                                }
                                else {
                                    callback_q(null);
                                }
                            });
                        });

                        q.drain = function() {
                            logger.info('User queue has been processed: ' + users.length + ' emails sent.');
                            renameFiles(function () {
                                callback(null, true);
                            });
                            
                        }

                        q.push(users, function (err) {
                            if (err) {
                                logger.error(err);
                            }
                        });
                    }
                    else {
                        callback(null, false);
                    }
                });
            }
            else {
                callback(null, false);
            }
        }
    });
}

/*
*   Get content (if it exists) for processing
*
*   Files with 'all-' are considerd ready for sending
*/
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

/*
*   Rename files so they don't get processed again
*/
function renameFiles(callback) {
    var files = fs.readdirSync(templatePath);
    _.each(files, function (file) {
        if (file.indexOf('all-') >= 0 && file.indexOf('.html') >= 0) {
            var newFile = file.replace('all-', '');
            fs.renameSync(templatePath + file, templatePath + newFile);
        }
        else if (file.indexOf('all-') >= 0 && file.indexOf('.txt') >= 0) {
            var newFile = file.replace('all-', '');
            fs.renameSync(templatePath + file, templatePath + newFile);
        }
    });

    callback();
}