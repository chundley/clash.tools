'use strict';

/*
*  Service for workflows
*/

angular.module('SiftrockApp.services')
.factory('workflowService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        save: function(workflow, callback) {
            $http({
                url: '/crud/workflow/' + workflow.account_id,
                method: 'POST',
                data: workflow,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('workflow-service.js', 'save', status), null);
            });
        },
        getByAccount: function(accountId, callback) {
            $http({
                url: '/crud/workflow/' + accountId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('workflow-service.js', 'getByAccount', status), null);
            });
        },
        getById: function(accountId, workflowId, callback) {
            $http({
                url: '/crud/workflow/' + accountId + '/' + workflowId,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('workflow-service.js', 'getById', status), null);
            });
        }
    }
}]);
