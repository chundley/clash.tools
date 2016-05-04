/*
*   API for sending mail
*/

var _        = require('underscore'),
    async    = require('async'),
    fs       = require('fs'),
    path     = require('path'),
    mandrill = require('mandrill-api'),
    sendgrid = require('sendgrid')('blah');

var user         = require('./user-model'),
    pwreset      = require('./pwreset-model'),
    appVersion   = require('../../package.json').version,
    templatePath = './server/email_templates/';

/*
*   Reset a forgotten password
*/
exports.pwReset = function(email, callback) {
    user.findByEmail(email, function (err, u) {
        if (err) {
            logger.warn('Attempt to reset password for invalid email: ' + email);
            callback('Attempt to reset password for invalid email: ' + email, null);
        }
        else {
            if (u) {
                // user exists, create a new password reset request
                pwreset.addRequest(u._id, function (err, request) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        // create a request Url from the environment base
                        var requestUrl = config.env[process.env.NODE_ENV].url.base + '/pwreset/' + request.token;

                        // create email
                        var emailMessage = new sendgrid.Email({
                            to: u.email_address,
                            toname: u.email_address,
                            subject: 'clash.tools password reset request',
                            from: 'hello@mail.clash.tools',
                            fromname: 'clash.tools',
                            text: pwResetTemplate(requestUrl, false),
                            html: pwResetTemplate(requestUrl, true)
                        });

                        sendEmail(emailMessage, function (err, result) {
                            if (err) {
                                callback(err, null);
                            }
                            else {
                                callback(null, result);
                            }
                        });
                    }
                });
            }
            else {
                callback(null, null);
            }
        }
    });
}

/*
*   Send a verify email
*/
exports.verifyEmail = function(id, callback) {
    user.findById(id, function (err, u) {
        if (err) {
            logger.warn('Attempt to verify invalid email: ' + email);
            callback('Attempt to verify invalid email: ' + email, null);
        }
        else {
            if (u) {
                // user exists, create a new verify email
                // create a verify Url from the user's verify token
                var requestUrl = config.env[process.env.NODE_ENV].url.base + '/verify/' + u.verify_token;

                // create email


                // create email
                var emailMessage = new sendgrid.Email({
                    to: u.email_address,
                    toname: u.email_address,
                    subject: 'Verify your email address',
                    from: 'hello@mail.clash.tools',
                    fromname: 'clash.tools',
                    text: verifyEmailTemplate(requestUrl, false),
                    html: verifyEmailTemplate(requestUrl, true)
                });

                sendEmail(emailMessage, function (err, result) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        callback(null, result);
                    }
                });
            }
            else {
                callback(null, null);
            }
        }
    });
}

/*
*   Welcome email for new user
*/
exports.welcome = function(userId, callback) {
    user.findById(userId, function (err, u) {
        if (err) {
            logger.error('Error getting user id ' +  userId + ' - ' + err);
            callback('Error getting user id ' +  userId + ' - ' + err, null);
        }
        else {
            if (u) {
                // user exists, create a new verify email
                // create a verify Url from the user's verify token
                var requestUrl = config.env[process.env.NODE_ENV].url.base + '/verify/' + u.verify_token;

                // create email
                var emailMessage = new sendgrid.Email({
                    to: u.email_address,
                    toname: u.email_address,
                    subject: 'Welcome to clash.tools',
                    from: 'hello@mail.clash.tools',
                    fromname: 'clash.tools',
                    text: newUserTemplate(requestUrl, false),
                    html: newUserTemplate(requestUrl, true)
                });

                sendEmail(emailMessage, function (err, result) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        callback(null, result);
                    }
                });
            }
            else {
                callback(null, null);
            }
        }
    });
}

/*
*   Welcome email for new user added by someone in the account
*/
/*exports.invite = function(userId, tempPW, from, callback) {
    user.findById(userId, function (err, u) {
        if (err) {
            logger.error('Error getting user id ' +  userId + ' - ' + err);
            callback('Error getting user id ' +  userId + ' - ' + err, null);
        }
        else {
            if (u) {
                // create email
                var msg = new MailMessage();

                msg.setHtml(inviteUserTemplate(true, tempPW, from));
                msg.setText(inviteUserTemplate(false, tempPW, from));
                msg.setSubject('Welcome to Siftrock');
                msg.addRecipient(u.email_address, u.email_address, 'to');
                msg.addTags(['invite', appVersion]);

                // use mandrill client library to send an email
                var mandrill_client = new mandrill.Mandrill(config.env[process.env.NODE_ENV].mandrill);
                mandrill_client.messages.send({"message": msg.createMessage(), "async": false, "ip_pool": null, "send_at": null}, function (result) {
                    logger.info('Sent invite email to: ' + u.email_address);
                    callback(null, u.email_address);
                },
                function (e) {
                    // Mandrill returns the error as an object with name and message keys
                    logger.error('A mandrill error occurred: ' + e.name + ' - ' + e.message);
                    callback(e.name + ' - ' + e.message, null);
                });
            }
            else {
                callback(null, null);
            }
        }
    });
}*/

/*
*   Generic email template for quick and dirty sends, such as new customer registration to admins
*/
/*exports.genericMail = function(recipients, subject, content, callback) {
    async.forEach(recipients, function (recipient, callback_inner) {
        // create email
        var msg = new MailMessage();

        msg.setHtml(genericTemplate(content, true));
        msg.setText(genericTemplate(content, false));
        msg.setSubject(subject);
        msg.addRecipient(recipient, recipient, 'to');
        msg.addTags(['generic', appVersion]);

        // use mandrill client library to send an email
        var mandrill_client = new mandrill.Mandrill(config.env[process.env.NODE_ENV].mandrill);
        mandrill_client.messages.send({"message": msg.createMessage(), "async": false, "ip_pool": null, "send_at": null}, function (result) {
            logger.info('Sent generic email (' + subject + ') to: ' + recipient);
            callback_inner(null, recipient);
        },
        function (e) {
            // Mandrill returns the error as an object with name and message keys
            logger.error('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            callback_inner(e.name + ' - ' + e.message, null);
        });
    }, function (err) {
        if (err) {
            logger.error('Problem sending generic email (' + subject + ': ' + err);
            callback(err);
        }
        else {
            callback(null);
        }
    });
}*/

/*
*   Send a canned email (product update, downtime notice, etc.)
*/
exports.cannedMail = function(recipient, ign, subject, contentHtml, contentText, callback) {
    var msg = new MailMessage();

    // do any swapping of tokens here
    if (contentHtml) {
        contentHtml = contentHtml.replace('[ign]', ign);
    }

    if (contentText) {
        contentText = contentText.replace('[ign]', ign);
    }


    if (!contentText || contentText.length == 0) {
        contentText = 'Message from clash.tools';
    }

    var emailMessage = new sendgrid.Email({
        to: recipient,
        toname: ign,
        subject: subject,
        from: 'hello@mail.clash.tools',
        fromname: 'clash.tools',
        text: contentText,
        html: contentHtml
    });

    sendEmail(emailMessage, function (err, result) {
        if (err) {
            callback(err, null);
        }
        else {
            callback(null, result);
        }
    });
}

/*
*   Form submitted from web site
*/
/*exports.wwwForm = function(formData, callback) {
    async.forEach(config.admins, function (recipient, callback_inner) {
        // create email
        var msg = new MailMessage();

        msg.setHtml(wwwFormTemplate(formData, true));
        msg.setText(wwwFormTemplate(JSON.stringify(formData), false));
        msg.setSubject('clash.tools form submission [' + formData.type + ']');
        msg.addRecipient(recipient, recipient, 'to');
        msg.addTags(['wwwForm', appVersion]);

        // use mandrill client library to send an email
        var mandrill_client = new mandrill.Mandrill(config.env[process.env.NODE_ENV].mandrill);
        mandrill_client.messages.send({"message": msg.createMessage(), "async": false, "ip_pool": null, "send_at": null}, function (result) {
            logger.info('Sent wwwForm email to: ' + recipient);
            callback_inner(null, recipient);
        },
        function (e) {
            // Mandrill returns the error as an object with name and message keys
            logger.error('A mandrill error occurred: ' + e.name + ' - ' + e.message);
            callback_inner(e.name + ' - ' + e.message, null);
        });
    }, function (err) {
        if(err) {
            logger.error('Problem sending www form email: ' + err);
            callback(err);
        }
        else {
            callback(null);
        }
    });
}*/

function sendEmail(emailMessage, callback) {
    sendgrid.api_key = config.env[process.env.NODE_ENV].sendgrid;
    sendgrid.send(emailMessage, function (err, json) {
        if (err) {
            logger.error(err);
            callback(err, null);
        }
        else {
            callback(null, json);
        }
    });
}

function pwResetTemplate(link, html) {
    var template = null;
    if (html) {
        template = fs.readFileSync(templatePath + 'pwReset.html', 'utf8');
    }
    else {
        template = fs.readFileSync(templatePath + 'pwReset.txt', 'utf8');
    }

    if (!template) {
        logger.error('Problem with email template for password reset');
        return null;
    }
    else {
        return template.replace('[link]', link);
    }
}

function verifyEmailTemplate(link, html) {
    var template = null;
    if (html) {
        template = fs.readFileSync(templatePath + 'verifyEmail.html', 'utf8');
    }
    else {
        template = fs.readFileSync(templatePath + 'verifyEmail.txt', 'utf8');
    }

    if (!template) {
        logger.error('Problem with email template for email verify');
        return null;
    }
    else {
        return template.replace('[link]', link);
    }
}

function newUserTemplate(link, html) {
    var template = null;
    if (html) {
        template = fs.readFileSync(templatePath + 'newUser.html', 'utf8');
    }
    else {
        template = fs.readFileSync(templatePath + 'newUser.txt', 'utf8');
    }

    if (!template) {
        logger.error('Problem with email template for a new user');
        return null;
    }
    else {
        return template.replace('[verifylink]', link);
    }
}

function inviteUserTemplate(html, tempPW, from) {
    var template = null;
    if (html) {
        template = fs.readFileSync(templatePath + 'inviteUser.html', 'utf8');
    }
    else {
        template = fs.readFileSync(templatePath + 'inviteUser.txt', 'utf8');
    }

    if (!template) {
        logger.error('Problem with email template for invited user');
        return null;
    }
    else {
        return template.replace('[invited]', from).replace('[password]', tempPW);
    }
}

function genericTemplate(content, html) {
    var template = null;
    if (html) {
        template = fs.readFileSync(templatePath + 'generic.html', 'utf8');
    }
    else {
        template = fs.readFileSync(templatePath + 'generic.txt', 'utf8');
    }

    if (!template) {
        logger.error('Problem with email template for generic email');
        return null;
    }
    else {
        return template.replace('[content]', content);
    }
}

function wwwFormTemplate(formData, html) {

    var formHtml = '<table width="100%" border="0" cellpadding="8" cellspacing="0" style="font-size: 12px; border: 1px solid #cfd2d6; border-collapse: collapse;"><tr><td colspan="2">Form type: <strong>' + formData.type + '</strong></td></tr>';
    _.each(formData.fields, function (field) {
        formHtml += '<tr style="border: 1px solid #cfd2d6;"><td valign="top">' + field.label + '</td><td valign="top">' + field.value + '</td></tr>';
    });
    formHtml += '</table>';

    var template = null;
    if (html) {
        template = fs.readFileSync(templatePath + 'wwwForm.html', 'utf8');
    }
    else {
        template = fs.readFileSync(templatePath + 'wwwForm.txt', 'utf8');
    }

    if (!template) {
        logger.error('Problem with email template for www form');
        return null;
    }
    else {
        template = template.replace('[form]', formHtml);
        return template;
    }
}

/*
*   mailMessage
*
*   A wrapper class for Mandrill-based email
*/
function MailMessage() {
    this.html = '';
    this.text = '';
    this.subject = '';
    this.from_email = 'hello@mail.clash.tools';
    this.from_name = 'clash.tools';
    this.to = [];
    this.headers = {};
    this.important = false;
    this.track_opens = true;
    this.track_clicks = false;
    this.auto_text = null;
    this.inline_css = null;
    this.url_strip_qs = null;
    this.preserve_recipients = false;
    this.view_content_link = true;
    this.bcc_address = null;
    this.tracking_domain = null;
    this.signing_domain = null;
    this.return_path_domain = null;
    this.merge = false;
    this.global_merge_vars = null;
    this.merge_vars = null,
    this.tags = [];
    this.subaccount = null;
    this.google_analytics_domains = [];
    this.google_analytics_campaign = null;
    this.metadata = { "AppVersion": appVersion};
    this.recipient_metadata = null;
    this.attachments = [];
    this.images = [];
}

MailMessage.prototype.createMessage = function() {
    var message = {
        "html": this.html,
        "text": this.text,
        "subject": this.subject,
        "from_email": this.from_email,
        "from_name": this.from_name,
        "to": this.to,
        "headers": this.headers,
        "important": this.important,
        "track_opens": this.track_opens,
        "track_clicks": this.track_clicks,
        "auto_text": this.auto_text,
        "inline_css": this.inline_css,
        "url_strip_qs": this.url_strip_qs,
        "preserve_recipients": this.preserve_recipients,
        "view_content_link": this.view_content_link,
        "bcc_address": this.bcc_address,
        "tracking_domain": this.tracking_domain,
        "signing_domain": this.signing_domain,
        "return_path_domain": this.return_path_domain,
        "merge": this.merge,
        "global_merge_vars": this.global_merge_vars,
        "merge_vars": this.merge_vars,
        "tags": this.tags,
        "subaccount": this.subaccount,
        "google_analytics_domains": this.google_analytics_domains,
        "google_analytics_campaign": this.google_analytics_campaign,
        "metadata": this.metadata,
        "recipient_metadata": this.recipient_metadata,
        "attachments": this.attachments,
        "images": this.images
    }
    return message;
}

MailMessage.prototype.setHtml = function(html) {
    this.html = html;
}

MailMessage.prototype.setText = function(text) {
    this.text = text;
}

MailMessage.prototype.setSubject = function(subject) {
    this.subject = subject;
}

MailMessage.prototype.addRecipient = function(email, name, type) {
    this.to.push(
        {
            "email": email,
            "name": name,
            "type": type
        }
    );
}

MailMessage.prototype.addTags = function(tags) {
    this.tags.push.apply(this.tags, tags);
}
