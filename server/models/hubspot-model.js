/*
*   API for integration with Hubspot
*/

var async   = require('async'),
    request = require('request'),
    _       = require('underscore');

var accountModel = require('./account-model'),
    config       = require('../../config/config'),
    util         = require('../../app/shared/util');

/*
*   Endpoints for the Hubspot API
*/
var endpoints = {
    auth: '/auth/v1/refresh',
    lists: '/contacts/v1/lists',
    leadFields: '/contacts/v1/properties'
};

/*
*   Normalize field types to something the UI understands
*/
var fieldTypeMap = {
    text: 'string',
    booleancheckbox: 'boolean'
};

/*
*   Verify credentials are valid - just try renewing the access token
*/
exports.verifyCredentials = function(accountId, callback) {
    accountModel.findById(accountId, function (err, account) {
        if (err) {
            callback(err, null);
        }
        else {
            renewAccessToken(accountId, account.integration.hubspot.refresh_token, function (err, result) {
                if (err) {
                    callback(err, null);
                }
                else {
                    // update the tokens in the account hubspot config
                    account.integration.hubspot.refresh_token = result.refresh_token;
                    account.integration.hubspot.access_token = result.access_token;
                    accountModel.saveModel(account, function (err, accountNew) {
                        if (err) {
                            callback(err, null);
                        }
                        else {
                            // send back the new access token
                            callback(null, account.integration.hubspot.access_token);
                        }
                    });
                }
            });
        }
    });
}

/*
*   Get static lists from Hubspot
*/
exports.getLists = function(accountId, callback) {
    var lists = [];
    var offset = 0;
    var count = 20;
    var done = false;

    async.doUntil(
        function (callback_inner) {
            makeRequest(accountId, endpoints.lists + '?count=' + count + '&offset=' + offset + '&', 'GET', null, function (err, response, result) {
                if (err) {
                    done = true;
                    callback_inner(err);
                }
                else {
                    // if 'has-more' is true we need to keep requesting for more lists
                    if (!result['has-more']) {
                        done = true;
                    }
                    else {
                        offset += 20;
                    }

                    _.each(result.lists, function (list) {
                        // only get static lists
                        if (list.listType === 'STATIC') {
                            lists.push({
                                id: list.listId,
                                name: list.name
                            });
                        }
                    });
                    callback_inner(null);
                }
            });
        },
        function() {
            return done;
        },
        function (err) {
            if (err) {
                callback(err, null);
            }
            else {
                callback(null, util.sortByKey(lists, 'name'));
            }
        }
    );
}

/*
*   Get Siftrock specific writeable lead fields from Hubspot
*/
exports.getFields = function(accountId, callback) {
    var retFields = [];
    makeRequest(accountId, endpoints.leadFields + '?', 'GET', null, function (err, response, result) {
        if (err) {
            callback(err, null);
        }
        else {
            _.each(result, function (field) {
                if (field.name.toLowerCase().indexOf('siftrock') >= 0) {
                    retFields.push({
                        id: field.groupName + '.' + field.name,
                        name: field.name,
                        type: fieldTypeMap[field.fieldType],
                        description: field.label
                    });
                }
            });
            callback(null, retFields);
        }
    });
}

/*
*   Wrap requests in a single method for token renewal and error handling
*/
function makeRequest(accountId, endpoint, requestType, requestBody, callback) {
    var retData = null;
    var retStatus = null;
    var tries = 0;
    accountModel.findById(accountId, function (err, account) {
        if (err) {
            callback(err, null);
        }
        else {
            var done = false;
            async.doUntil(
                function (callback_inner) {
                    var reqUrl = config.env[process.env.NODE_ENV].hubspotApi.baseUrl + endpoint +
                                 'access_token=' + account.integration.hubspot.access_token;
                    request(reqUrl, { method: requestType, body: requestBody, json: true },
                        function (err, response, body) {
                            tries++;
                            if (err) {
                                done = true;
                                callback_inner(err);
                            }
                            else {
                                var result = body;
                                retStatus = response.request.response.statusCode;
                                if (result && result.status && result.status === 'error') {
                                    var needToken = false;
                                    if (result.message.indexOf('access_token') >= 0) {
                                        needToken = true;
                                    }

                                    if (needToken) {
                                        renewAccessToken(account._id,
                                                         account.integration.hubspot.refresh_token,
                                                         function (err, tokenResponse) {
                                            if (err) {
                                                callback_inner(err, null, null);
                                            }
                                            else {
                                                logger.info('Hubspot API token renewed for account: ' + account.name);
                                                account.integration.hubspot.access_token = tokenResponse.access_token;

                                                // save the new access token for use until it expires
                                                accountModel.setField(account._id, 'integration.hubspot.access_token', tokenResponse.access_token, function (err, acct) {
                                                    if (err) {
                                                        done = true;
                                                        callback_inner(err);
                                                    }
                                                    else {
                                                        callback_inner(null);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                    else {
                                        if (result.message.indexOf('already exists') >= 0) {
                                            // not really an error
                                            logger.debug('Contact already exists in Hubspot');
                                            done = true;
                                            callback_inner(null);
                                        }
                                        else {
                                            // some other kind of response error occurred
                                            logger.error('Hubspot API call failed for account: ' + account.name + ' - call: ' + reqUrl + ' - response: ' + JSON.stringify(result));
                                            done = true;
                                            callback_inner('Hubspot API call failed');
                                        }
                                    }
                                }
                                else {
                                    // no errors - result should be good data
                                    done = true;
                                    retData = result;
                                    callback_inner(null);
                                }
                            }
                        }
                    );
                },
                function() {
                    if (tries > 10) {
                        done = true;
                    }
                    return done;
                },
                function (err) {
                    if (err) {
                        callback(err, null);
                    }
                    else {
                        callback(null, retStatus, retData);
                    }
                }
            );
        }
    });
}

/*
*   Renew's the API access token
*/
function renewAccessToken(accountId, refreshToken, callback) {
    var reqUrl = config.env[process.env.NODE_ENV].hubspotApi.baseUrl +
                 endpoints.auth +
                 '?refresh_token=' + refreshToken +
                 '&client_id=' + config.env[process.env.NODE_ENV].hubspotApi.clientId +
                 '&grant_type=refresh_token';
    request(reqUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        function (err, response, body) {
            if (err) {
                callback(err, null);
            }
            else {
                if (response.request.response.statusCode === 400) {
                    // the renewal token is bad or out of date - credentials are no good for Hubspot at this point
                    accountModel.setField(accountId, 'integration.hubspot', {}, function (err, acct) {
                        if (err) {
                            logger.error('Could not update integration.hubspot field in account: ' + accountId);
                        }
                    });
                    callback('Invalid renewal token', null);
                }
                else {
                    callback(null, JSON.parse(body));
                }
            }
        }
    );
}
