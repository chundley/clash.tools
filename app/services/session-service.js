'use strict';

/*
*  Session service for managing session data for client-state
*/

angular.module('Clashtools.services')
.factory('sessionService', ['$http', 'cacheService', 'userService', 'accountService',
function ($http, cacheService, userService, accountService) {

    var currentAccount = null;
    var userSession = null;
    var userMeta = null;
    var realUser = null; // used for unspoofing

    return {
        getCurrentAccount: function(userid, callback) {
            if (currentAccount) {
                callback(null, currentAccount);
            }
            else {
                accountService.getByUserId(userid, function (err, account) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'session-service.js', func: 'getCurrentAccount', message: 'Error getting user' } );
                        callback(err, null);
                    }
                    else {
                        currentAccount = account;
                        callback(null, currentAccount);
                    }

                });
            }
        },
        getUserMeta: function(userid, callback) {
            if (userMeta) {
                callback(null, userMeta);
            }
            else {
                userService.getMeta(userid, function (err, meta) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'session-service.js', func: 'getUserMeta', message: 'Error getting meta data: ' + err } );
                        callback(err, null);
                    }
                    else {
                        userMeta = meta;
                        callback(null, meta);
                    }
                });
            }
        },
        clearUserMeta: function() {
            userMeta = null;
        },
        getUserSession: function(userid, callback) {
            if (userSession) {
                callback(null, userSession);
            }
            else {
                userService.getSession(userid, function (err, session) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'session-service.js', func: 'getUserSession', message: 'Error getting user session' } );
                        callback(err, null);
                    }
                    else {
                        userSession = session;
                        callback(null, userSession);
                    }
                });
            }
        },
        saveUserSession: function(userid, session, callback) {
            userService.saveSession(userid, session, function (err, session_result) {
                if (err) {
                    err.stack_trace.unshift( { file: 'session-service.js', func: 'saveUserSession', message: 'Error saving user session' } );
                    callback(err, null);
                }
                else {
                    userSession = session;
                    callback(null, userSession);
                }
            });
        },
        setRealUser: function(user, callback) {
            realUser = JSON.parse(JSON.stringify(user));
            callback();
        },
        getRealUser: function(callback) {
            if (!realUser) {
                callback('No user in session', null);
            }
            else {
                callback(null, realUser);
            }
        },
        clearSession: function() {
            // clear session data (on logout for example). Doesn't clear the database
            currentAccount = null;
            userSession = null;
            userMeta = null;
            cacheService.removeAll();
        }
    }
}]);

