'use strict';

/*
*  Service for app email messages
*/

angular.module('Clashtools.services')
.factory('emailMessageService', ['$http', '$rootScope', 'authService', 'errorService',
function ($http, $rootScope, authService, errorService) {
    return {
        save: function(emailMessage, callback) {
            $http({
                url: '/crud/email',
                method: 'POST',
                data: emailMessage,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                // there's a listener in the topNav directive for the emailUpdate variable
                $rootScope.emailUpdate = new Date();
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('emailmessage-service.js', 'save', status), null);
            });
        },
        get: function(userId, count, callback) {
            $http({
                url: '/crud/email?userId=' + userId + '&count=' + count,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('messagelog-service.js', 'get', status), null);
            });
        },
        setRead: function(messageId, userId, callback) {
            $http({
                url: '/crud/email/' + messageId + '/' + userId,
                method: 'POST'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('messagelog-service.js', 'get', status), null);
            });
        },
        delete: function(messageId, userId, callback) {
            $http({
                url: '/crud/email/' + messageId + '/' + userId,
                method: 'DELETE'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('messagelog-service.js', 'get', status), null);
            });
        },
        getById: function(messageId, callback) {
            $http({
                url: '/crud/email/' + messageId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('messagelog-service.js', 'get', status), null);
            });
        },
        countNew: function(userId, callback) {
            $http({
                url: '/crud/email/countnew/' + userId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('messagelog-service.js', 'get', status), null);
            });
        }
    }
}]);
