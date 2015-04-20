'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('HomeCtrl', ['$rootScope', '$scope', '$modal', 'authService', 'cacheService', 'sessionService', 'accountService', 'errorService', 'utils', 'analyticsService', 'dashboardCharts',
function ($rootScope, $scope, $modal, authService, cacheService, sessionService, accountService, errorService, utils, analyticsService, dashboardCharts) {
    // initialize
    $rootScope.title = 'Dashboard - clash.tools';

    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    $scope.nullState = false;

/*
    $scope.filterSet = {
        days: [
            {
                num: 7,
                display: '7d',
                active: 'no'
            },
            {
                num: 30,
                display: '30d',
                active: 'no'
            },
            {
                num: 90,
                display: '90d',
                active: 'no'
            },
            {
                num: 3650,
                display: 'All',
                active: 'no'
            }
        ]
    };*/
/*
    sessionService.getUserSession(authService.user.id, function (err, session) {
        if (err) {
            err.stack_trace.unshift( { file: 'home-controller.js', func: 'init', message: 'Error getting user session' } );
            errorService.save(err, function() {});
        }
        else {
            var now = moment.utc(new moment());
            var diff = now.diff(new moment(session.dashboard_filters.last_changed), 'seconds');

            if (diff > 900) {
                // it's been more than 15 minutes since they last updated session, reset.
                session.dashboard_filters = {
                    days: 90
                };

                $scope.userSession = session;
                saveUserSession();
            }
            else {
                $scope.userSession = session;
            }

            angular.forEach($scope.filterSet.days, function (day) {
                if (day.num == session.dashboard_filters.days) {
                    day.active = 'day-link-active';
                }
                else {
                    day.active = 'no';
                }
            });

            sessionService.getCurrentAccount(authService.user.id, function (err, account) {
                if (err) {
                    err.stack_trace.unshift( { file: 'home-controller.js', func: 'init', message: 'Error getting current account' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.accountId = account._id;
                    resetData();
                }
            });
        }
    });*/


    /*
    *   Saves the user session when it changes
    */
    function saveUserSession() {
        $scope.userSession.dashboard_filters.last_changed = new Date();
        sessionService.saveUserSession(authService.user.id, $scope.userSession, function (err, session) {
            if (err) {
                err.stack_trace.unshift( { file: 'dashboard-controller.js', func: '$scope.setPerPage', message: 'Error saving user session' } );
                errorService.save(err, function() {});
            }
        });
    }

}]);