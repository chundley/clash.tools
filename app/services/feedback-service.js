'use strict';

/*
*  Service for sending feedback to github
*/

angular.module('SiftrockApp.services')
.factory('feedbackService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        submit: function(issue, callback) {
            $http({
                url: '/gh/issue',
                method: "POST",
                data: issue,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('feedback-service.js', 'submit', status));
            });
        }
    };

}]);
