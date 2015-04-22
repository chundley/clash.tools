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
                url: '/crud/email/' + userId + '?count=' + count,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('messagelog-service.js', 'get', status), null);
            });
        },
        /*dismiss: function(userId, messageId, callback) {
            ///crud/messagelog/:user_id/dismiss/:message_id
            $http({
                url: '/crud/messagelog/' + userId + '/dismiss/' + messageId,
                method: 'POST',
                data: null,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                // there's a listener in the topNav directive for the logUpdate variable
                $rootScope.logUpdate = new Date();
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('messagelog-service.js', 'dismiss', status), null);
            });

        }*/
    }
}]);
