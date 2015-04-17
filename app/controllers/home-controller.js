'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('SiftrockApp.controllers')
.controller('HomeCtrl', ['$rootScope', '$scope', '$modal', 'authService', 'cacheService', 'sessionService', 'accountService', 'errorService', 'utils', 'analyticsService', 'dashboardCharts',
function ($rootScope, $scope, $modal, authService, cacheService, sessionService, accountService, errorService, utils, analyticsService, dashboardCharts) {
    // initialize
    $rootScope.title = 'Siftrock - Home';

    $scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    $scope.nullState = false;

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
    };

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
    });


    /*
    *   Filter by number of days
    */
    $scope.filterDay = function(numDays) {
        angular.forEach($scope.filterSet.days, function (day) {
            if (day.num == numDays) {
                day.active = 'day-link-active';
                $scope.userSession.dashboard_filters.days = numDays;
            }
            else {
                day.active = 'no';
            }
        });
        saveUserSession();
        resetData();
    }

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

    /*
    *   Called whenever data on the view has changed:
    *   - Initial page load
    *   - Days filter changed
    */
    function resetData() {
        analyticsService.summary($scope.accountId, $scope.userSession.dashboard_filters.days, function (err, summary) {
            $scope.totalEmails = summary.total_replies;
            if ($scope.totalEmails > 0) {
                $scope.nullState = false;
                $scope.totalPeople = summary.total_names;
                $scope.totalEmailAddresses = summary.total_email_addresses;
                $scope.totalPhoneNumbers = summary.total_phone_numbers;
                analyticsService.emailCountByDay($scope.accountId, $scope.userSession.dashboard_filters.days, function (err, emails) {

                   dashboardCharts.emailsByDay(emails, function (options) {
                        // total emails by day chart
                        $scope.hcEmailsByDay = options;
                    });
                });

                analyticsService.emailCountByType($scope.accountId, $scope.userSession.dashboard_filters.days, function (err, types) {
                    // customize data for reporting
                    angular.forEach(types, function (value, key) {
                        if (value.type == 'left') {
                            value.type = 'left company';
                        }
                        if (value.type == 'general') {
                            value.type = 'general OOF'
                        }

                        value.type = value.type[0].toUpperCase() + value.type.slice(1);
                    });

                    types.sort(function (a, b) {
                        if (a.count < b.count) {
                            return 1;
                        }
                        else if (a.count > b.count) {
                            return -1;
                        }
                        else {
                            return 0;
                        }
                    });

                    dashboardCharts.emailsByType(types, function (options) {
                        // total emails by type chart
                        $scope.hcEmailsByType = options;
                    });
                }); // end analyticsService.emailCountByType
            }
            else {
                $scope.nullState = true;
            }
        });
    }
}]);