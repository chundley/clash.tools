'use strict';

/*
*  Service for user data
*/

angular.module('Clashtools.services')
.factory('userService', ['$http', 'errorService',
function ($http, errorService) {
    return {
        getAllUsers: function (callback) {
            $http({
                url: '/crud/user',
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(status, null);
            });
        },
        getById: function (id, callback) {
            $http({
                url: '/crud/user/' + id,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'getById', status), null);
            });
        },
        getByVerifyToken: function (id, callback) {
            $http({
                url: '/crud/verifyemail/' + id,
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'getByVerifyToken', status), null);
            });
        },
        setVerified: function (id, callback) {
            $http({
                url: '/crud/verifyemail/' + id,
                method: 'POST'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'setVerified', status), null);
            });
        },
        updateRole: function (id, role, callback) {
            $http({
                url: '/crud/user/' + id + '/role?role=' + role,
                method: "POST",
                data: null,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'update', status), null);
            });
        },
        updateClan: function (id, clan, callback) {
            $http({
                url: '/crud/user/' + id + '/clan',
                method: "POST",
                data: clan,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'update', status), null);
            });
        },        
        update: function (id, user, callback) {
            $http({
                url: '/crud/user/' + id,
                method: "POST",
                data: user,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'update', status), null);
            });
        },
        changePassword: function (id, password, callback) {
            $http({
                url: '/crud/user/' + id + '/pw',
                method: "POST",
                data: { 'new_password': password },
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'changePassword', status), null);
            });
        },
        disable: function (id, callback) {
            $http({
                url: '/crud/user/' + id + '/disable',
                method: "POST",
                data: null,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'disable', status), null);
            });
        },
        getMeta: function(id, callback) {
            $http({
                url: '/crud/user/' + id + '/meta',
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'getMeta', status), null);
            });
        },
        getSession: function(id, callback) {
            $http({
                url: '/crud/user/' + id + '/session',
                method: 'GET'
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'getSession', status), null);
            });
        },
        saveSession: function(id, session, callback) {
            $http({
                url: '/crud/user/' + id + '/session',
                method: "POST",
                data: session,
                headers: {'Content-Type': 'application/json'}
            }).success(function (data, status, headers, config) {
                callback(null, data);
            }).error(function (data, status, headers, config) {
                callback(errorService.initMessage('user-service.js', 'saveSession', status), null);
            });
        }
    }
}]);
