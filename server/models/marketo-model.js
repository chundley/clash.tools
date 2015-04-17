/*
*   API for integration with Marketo
*/

var async   = require('async'),
    request = require('request'),
    _       = require('underscore');

var accountModel = require('./account-model'),
    util         = require('../../app/shared/util');


/*
*   Endpoints for the Marketo API
*/

var endpoints = {
    auth: '/oauth/token',
    lists: '/v1/lists.json',
    leadFields: '/v1/leads/describe.json'
};

/*
*   Error status codes we take action on
*   http://developers.marketo.com/documentation/rest/error-codes/
*/
var errorCodes = {
    invalidAuthCreds: 401,
    invalidToken: 601,
    tokenExpired: 602,
    accessDenied: 603
}

/*
*   Normalize field types to something the UI understands
*/
var fieldTypeMap = {
    'boolean': 'boolean',
    'string': 'string',
    'text': 'string'
};

/*
*   Verify credentials are valid
*/
exports.verifyCredentials = function(identityUrl, clientId, clientSecret, callback) {
    renewAccessToken(identityUrl, clientId, clientSecret, function (err, result) {
        if (err) {
            callback(err, null);
        }
        else {
            callback(null, result);
        }
    });
}

/*
*   Get static lists from Marketo
*
*   A maximum of 300 lists will be returned in each call. If there are more lists
*   available the 'nextPageToken' field will exist with a value to get the next 300
*/
exports.getLists = function(accountId, callback) {
    var lists = [];
    var done = false;
    var nextPageToken = null;

    async.doUntil(
        function (callback_inner) {
            var reqUrl = endpoints.lists + '?';

            if (nextPageToken) {
                reqUrl += 'nextPageToken=' + nextPageToken + '&';
            }

            makeRequest(accountId, reqUrl, 'GET', null, function (err, result) {
                if (err) {
                    done = true;
                    callback_inner(err);
                }
                else {
                    lists = lists.concat(result.result);
                    if (result.nextPageToken && result.nextPageToken.length > 0) {
                        nextPageToken = result.nextPageToken;
                    }
                    else {
                        done = true;
                    }
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
*   Get Siftrock specific writeable lead fields from Marketo
*/
exports.getFields = function(accountId, callback) {
    var retFields = [];
    makeRequest(accountId, endpoints.leadFields + '?', 'GET', null, function (err, result) {
        if (err) {
            callback(err, null);
        }
        else {
            _.each(result.result, function (field) {
                if (field.rest.name.toLowerCase().indexOf('siftrock') >= 0 && !field.rest.readOnly) {
                    retFields.push({
                        id: field.id,
                        name: field.rest.name,
                        type: fieldTypeMap[field.dataType],
                        description: field.displayName
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
    var tries = 0;
    accountModel.findById(accountId, function (err, account) {
        if (err) {
            callback(err, null);
        }
        else {
            var done = false;
            async.doUntil(
                function (callback_inner) {
                    var reqUrl = account.integration.marketo.endpoint + endpoint + 'access_token=' + account.integration.marketo.access_token;
                    request(reqUrl, { method: requestType, body: requestBody, json: true },
                        function (err, response, body) {
                            tries++;
                            if (err) {
                                done = true;
                                callback_inner(err, null);
                            }
                            else {
                                if (body.errors && body.errors.length > 0) {
                                    // errors - check for token renewal
                                    var needToken = false;
                                    _.each(body.errors, function (error) {
                                        // http://developers.marketo.com/documentation/rest/error-codes/
                                        if (error.code == '601' || error.code == '602') {
                                            needToken = true;
                                        }
                                    });

                                    if (needToken) {
                                        renewAccessToken(account.integration.marketo.identity,
                                                         account.integration.marketo.client_id,
                                                         account.integration.marketo.client_secret,
                                                         function (err, tokenResponse) {
                                            if (err) {
                                                callback_inner(err, null);
                                            }
                                            else {
                                                logger.info('Marketo API token renewed for account: ' + account.name);
                                                account.integration.marketo.access_token = tokenResponse.access_token;

                                                // save the new access token for use until it expires
                                                accountModel.setField(account._id, 'integration.marketo.access_token', tokenResponse.access_token, function (err, acct) {
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
                                        // some other kind of response error occurred
                                        done = true;
                                        logger.error('Marketo API call failed for account: ' + account.name + ' - call: ' + reqUrl);
                                        logger.error(body);
                                        callback_inner('Marketo API call failed');
                                    }
                                }
                                else {
                                    // no errors - result should be good data
                                    done = true;
                                    retData = body;
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
                        callback(null, retData);
                    }
                }
            );
        }
    });
}

/*
*   Renew's the API access token
*/
function renewAccessToken(identityUrl, clientId, clientSecret, callback) {
    var reqUrl = identityUrl +
                 endpoints.auth +
                 '?grant_type=client_credentials' +
                 '&client_id=' + clientId +
                 '&client_secret=' + clientSecret;

    request(reqUrl, { method: 'GET' },
        function (err, response, body) {
            if (response.request.response.statusCode === errorCodes.invalidAuthCreds) {
                // something is wrong with client id or refresh token - credentials are no good for Marketo at this point
/*                accountModel.setField(accountId, 'integration.marketo.access_token', '', function (err, acct) {
                    if (err) {
                        logger.error('Could not update integration.marketo field in account: ' + accountId);
                    }
                });*/
                callback('Invalid renewal token', null);
            }
            else {
                callback(null, JSON.parse(body));
            }


        }
    );
}
