'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('ActionCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$modal', 'moment', 'authService', 'cacheService', 'sessionService', 'userService', 'errorService', 'messagelogService', 'emailMessageService', 'CLAN_EMAILS',
function ($rootScope, $scope, $routeParams, $location, $modal, moment, authService, cacheService, sessionService, userService, errorService, messagelogService, emailMessageService, CLAN_EMAILS) {
    // initialize
    $rootScope.title = 'Actions - clash.tools';

    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    $scope.nullState = false;

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'action-controller.js', func: 'init', message: 'Error getting user meta data' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.ign = meta.ign;
            $scope.clan = meta.current_clan;

            var actionType = $routeParams.id;

            // new user confirmed to clan
            if (actionType == 'confirm') {
                var userId = $location.search().id;
                userService.getById(userId, function (err, user) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'action-controller.js', func: 'init', message: 'Error getting user for confirmation' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        // set user's current clan and clan history
                        user.current_clan = {
                            clan_id: $scope.clan.clan_id,
                            name: $scope.clan.name,
                            clan_tag: $scope.clan.clan_tag,
                            joined: new Date()
                        };

                        user.clan_history.push(user.current_clan);
                        userService.update(user._id, user, function (err, result) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'action-controller.js', func: 'init', message: 'Error saving user' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                // send email indicating they've been accepted
                                var emailMsg = {
                                    subject: 'You have been accepted to ' + $scope.clan.name,
                                    message: CLAN_EMAILS.joinConfirmed.replace(/\[1\]/g, $scope.clan.name).replace(/\[2\]/g, $scope.ign),
                                    from_user: {
                                        user_id: authService.user.id,
                                        ign: $scope.ign,
                                        deleted: false
                                    },
                                    to_users: [
                                        {
                                            user_id: user._id,
                                            ign: user.ign,
                                            read: false,
                                            deleted: false
                                        }
                                    ],
                                    created_at: new Date()
                                };

                                emailMessageService.save(emailMsg, function (err, msg) {
                                    if (err) {

                                    }
                                    else {
                                        // do something yeah?
                                    }
                                });

                                // Log this activity
                                messagelogService.save($scope.clan.clan_id, '[ign] was accepted to the clan by ' + $scope.ign, user.ign, 'member', function (err, msg) {
                                    if (err) {
                                        err.stack_trace.unshift( { file: 'clan-controller.js', func: '$scope.saveNewClan', message: 'Error saving new clan message in the log' } );
                                        errorService.save(err, function() {});
                                    }
                                });
                            }
                        });
                    }
                });

                $location.url('/mail').replace();
            }
        }

    });




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




}]);