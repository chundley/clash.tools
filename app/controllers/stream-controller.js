'use strict';

/*
*   Controller for logging out
*/

angular.module('SiftrockApp.controllers')
.controller('StreamCtrl', ['$rootScope', '$scope', '$window', 'moment', 'authService', 'sessionService', 'errorService', 'emailStreamService', 'RESPONSE_TYPES',
function ($rootScope, $scope, $window, moment, authService, sessionService, errorService, emailStreamService, RESPONSE_TYPES) {

    $rootScope.title = 'Siftrock - Incoming Email Stream';
    $scope.helpLink = 'http://www.siftrock.com/help/stream/';
    $scope.nullState = false;

    $scope.totalEmails = 0;

    $scope.types = RESPONSE_TYPES;
    $scope.types['all'] = { type: 'all', displayCaps: 'All', displaySmall: 'all' };

    $scope.filterSet = {
        days: [
            {
                num: 1,
                display: '1d',
                active: 'no'
            },
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
        ],
        displayType: 'All'
    };

    sessionService.getUserSession(authService.user.id, function (err, session) {
        if (err) {
            err.stack_trace.unshift( { file: 'stream-controller.js', func: 'init', message: 'Error getting user session' } );
            errorService.save(err, function() {});
        }
        else {
            var now = moment.utc(new moment());
            var diff = now.diff(new moment(session.stream_filters.last_changed), 'seconds');

            if (diff > 900) {
                // it's been more than 15 minutes since they last updated session, reset.
                session.stream_filters = {
                    days: 30,
                    type: 'all',
                    recipient: '',
                    page: 1,
                    first_date: 0,
                    last_date: 0,
                    first_id: 0,
                    last_id: 0
                };

                $scope.userSession = session;
                saveUserSession();
            }
            else {
                $scope.userSession = session;
            }

            $scope.filterSet.displayType = $scope.types[session.stream_filters.type].displayCaps;

            angular.forEach($scope.filterSet.days, function (day) {
                if (day.num == session.stream_filters.days) {
                    day.active = 'day-link-active';
                }
                else {
                    day.active = 'no';
                }
            });

            sessionService.getCurrentAccount(authService.user.id, function (err, account) {
                if (err) {
                    err.stack_trace.unshift( { file: 'stream-controller.js', func: 'init', message: 'Error getting current account' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.accountId = account._id;
                    resetData();
                }
            });
        }
    });

    $scope.hideEmail = function(id) {
        // set hidden and refresh the page
        emailStreamService.setHidden($scope.accountId, id, function (err, result) {
            if ($scope.emails.length == 1) {
                // This is the only email on the page and is being hidden, need to go back one page
                //    note: if it's the last item overall, the refresh will set null state
                $scope.userSession.stream_filters.page -= 1;
                resetData();
            }
            else {
                resetData();
            }

            $rootScope.globalMessage = "Email hidden";
        });
    }

    $scope.changePage = function(page) {
        changePageInternal(page);
    }

    $scope.setPerPage = function(num) {
        $scope.userSession.stream_per_page = num;
        $scope.userSession.stream_filters.page = 1;
        $scope.userSession.stream_filters.first_date = 0;
        $scope.userSession.stream_filters.last_date = 0;
        $scope.userSession.stream_filters.first_id = 0;
        $scope.userSession.stream_filters.last_id = 0;
        saveUserSession();
        resetData();
    }

    /*
    *   Filter by number of days
    */
    $scope.filterDay = function(numDays) {
        angular.forEach($scope.filterSet.days, function (day) {
            if (day.num == numDays) {
                day.active = 'day-link-active';
                $scope.userSession.stream_filters.days = numDays;
            }
            else {
                day.active = 'no';
            }
        });
        $scope.userSession.stream_filters.page = 1;
        $scope.userSession.stream_filters.first_date = 0;
        $scope.userSession.stream_filters.last_date = 0;
        $scope.userSession.stream_filters.first_id = 0;
        $scope.userSession.stream_filters.last_id = 0;
        saveUserSession();
        resetData();
    }

    /*
    *   Filter by type
    */
    $scope.filterType = function(type) {
        $scope.filterSet.displayType = $scope.types[type].displayCaps;
        $scope.userSession.stream_filters.type = type;
        $scope.userSession.stream_filters.page = 1;
        $scope.userSession.stream_filters.first_date = 0;
        $scope.userSession.stream_filters.last_date = 0;
        $scope.userSession.stream_filters.first_id = 0;
        $scope.userSession.stream_filters.last_id = 0;
        saveUserSession();
        resetData();
    }

    /*
    *   Filter by recipient
    */
    $scope.filterRecipient = function() {
        $scope.userSession.stream_filters.page = 1;
        $scope.userSession.stream_filters.first_date = 0;
        $scope.userSession.stream_filters.last_date = 0;
        $scope.userSession.stream_filters.first_id = 0;
        $scope.userSession.stream_filters.last_id = 0;
        saveUserSession();
        resetData();
    }

    $scope.refresh = function() {
        resetData();
    }

    /*
    *   Export names with current set of filters
    */
    $scope.exportNames = function() {
        $window.location.href = '/export/' + $scope.accountId + '/allNames?filters=' + JSON.stringify($scope.userSession.stream_filters);
    }

    /*
    *   Saves the user session when it changes
    */
    function saveUserSession() {
        $scope.userSession.stream_filters.last_changed = new Date();
        sessionService.saveUserSession(authService.user.id, $scope.userSession, function (err, session) {
            if (err) {
                err.stack_trace.unshift( { file: 'stream-controller.js', func: '$scope.setPerPage', message: 'Error saving user session' } );
                errorService.save(err, function() {});
            }
        });
    }

    // called when data has changed from the client's perspective, either on:
    //  - page load
    //  - hide contact
    //  - refresh list
    function resetData() {
        emailStreamService.getEmailCount($scope.accountId, $scope.userSession.stream_filters, function (err, count) {
            if (err) {
                err.stack_trace.unshift( { file: 'stream-controller.js', func: 'resetData', message: 'Error getting email count' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.totalEmails = count.count;
                if ($scope.totalEmails == 0) {
                    $scope.nullState = true;
                    $scope.emails = null;
                }
                else {
                    $scope.nullState = false;
                    changePageInternal($scope.userSession.stream_filters.page);
                }
            }
        });
    }

    function changePageInternal(page) {
        emailStreamService.getByAccountId($scope.accountId, $scope.userSession.stream_per_page, page - $scope.userSession.stream_filters.page, $scope.userSession.stream_filters, function (err, emails) {
            if (emails.length > 0) {
                angular.forEach(emails, function (email, key) {
                    email.domain = email.from_address.split('@')[1];
                    email.date = new moment(email.date);
                    var newNames = 0;
                    angular.forEach(email.people, function (person, key) {
                        if (!person.sender) {
                            newNames++;
                        }
                    });
                    email.new_name_count = newNames;
                });
                $scope.emails = emails;
                $scope.userSession.stream_filters.page = page;
                $scope.userSession.stream_filters.first_date = emails[0].date;
                $scope.userSession.stream_filters.last_date = emails[emails.length-1].date;
                $scope.userSession.stream_filters.first_id = emails[0]._id;
                $scope.userSession.stream_filters.last_id = emails[emails.length-1]._id;
                $scope.userSession.stream_filters.page = page;
                saveUserSession();
                resetPaginator();
            }
        });
    }

    function resetPaginator() {
        $scope.pages = [];
        $scope.numPages = parseInt($scope.totalEmails / $scope.userSession.stream_per_page);
        if ($scope.totalEmails % $scope.userSession.stream_per_page > 0) {
            $scope.numPages++;
        }

        if ($scope.numPages < 8) {
            // Short-circuit the complex paging logic if there are less than 8 pages
            for (var idx=0; idx<$scope.numPages; idx++) {
                $scope.pages.push(idx+1);
            }
        }
        else {
            // for more than seven pages, create pagination controls that make sense

            //left
            for (var idx=$scope.userSession.stream_filters.page - 3; idx<$scope.userSession.stream_filters.page; idx++) {
                if (idx > 0) {
                    $scope.pages.push(idx);
                }
            }

            // current
            $scope.pages.push($scope.userSession.stream_filters.page);

            var padding = 8 - $scope.pages.length;

            // right
            for (var idx=$scope.userSession.stream_filters.page + 1; idx<$scope.userSession.stream_filters.page + padding; idx++) {
                if (idx <= $scope.numPages) {
                    $scope.pages.push(idx);
                }
            }

            // if in the last six slots, there needs to be padding at the left
            if ($scope.pages.length < 7 && $scope.numPages > 6) {
                var len = $scope.pages.length;
                for (var p=len; p<7; p++) {
                    $scope.pages.unshift($scope.pages[0]-1);
                }
            }
        }
    }
}]);
