'use strict';

/*
*  Service for account messages
*/

angular.module('Clashtools.services')
.factory('messagelogService', ['$http', '$rootScope', 'authService', 'errorService',
function ($http, $rootScope, authService, errorService) {
    return {
        save: function(accountId, message, type, data, callback) {
            var newMsg = {
                account_id: accountId,
                user_id: authService.user.id,
                created_at: new Date(),
                type: type,
                message: message,
                dismissed: [],
                data: data
            };

            $http({
                url: '/crud/messagelog/' + message.account_id,
                method: 'POST',
                data: newMsg,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                // there's a listener in the topNav directive for the logUpdate variable
                $rootScope.logUpdate = new Date();
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('messagelog-service.js', 'save', status), null);
            });
        },
        get: function(userId, count, callback) {
            $http({
                url: '/crud/messagelog/' + userId + '?count=' + count,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('messagelog-service.js', 'get', status), null);
            });
        },
        dismiss: function(userId, messageId, callback) {
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

        }
    }
}]);
