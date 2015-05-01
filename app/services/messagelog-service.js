'use strict';

/*
*  Service for account messages
*/

angular.module('Clashtools.services')
.factory('messagelogService', ['$http', '$rootScope', 'authService', 'errorService',
function ($http, $rootScope, authService, errorService) {
    return {
        save: function(clanId, message, ign, type, callback) {
            var newMsg = {
                clan_id: clanId,
                user_id: authService.user.id,
                created_at: new Date(),
                message: message,
                ign: ign,
                type: type /* member, target (called), target (attacked), special (start war) */
            };

            $http({
                url: '/crud/messagelog/' + message.clan_id,
                method: 'POST',
                data: newMsg,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('messagelog-service.js', 'save', status), null);
            });
        },
        get: function(clanId, count, callback) {
            $http({
                url: '/crud/messagelog/' + clanId + '?count=' + count,
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
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('messagelog-service.js', 'dismiss', status), null);
            });

        }
    }
}]);
