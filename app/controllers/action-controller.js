'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('ActionCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'authService', 'sessionService', 'userService', 'errorService', 'messagelogService', 'emailMessageService', 'CLAN_EMAILS',
function ($rootScope, $scope, $routeParams, $location, authService, sessionService, userService, errorService, messagelogService, emailMessageService, CLAN_EMAILS) {
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
            var actionType = $routeParams.id;

            if (actionType == 'confirm') {
                confirmNewMember(meta, $location.search().id)
                $location.url('/mail').replace();
            }
            else if (actionType == 'decline') {
                declineNewMember(meta, $location.search().id)
                $location.url('/mail').replace();           
            }
        }

    });

    function confirmNewMember(userMeta, newUserId) {
        userService.getById(newUserId, function (err, user) {
            if (err) {
                err.stack_trace.unshift( { file: 'action-controller.js', func: 'confirmNewMember', message: 'Error getting user for confirmation' } );
                errorService.save(err, function() {});
            }
            else {
                // set user's current clan and clan history
                var newClan = {
                    _id: userMeta.current_clan.clan_id,
                    name: userMeta.current_clan.name,
                    clan_tag: userMeta.current_clan.clan_tag,
                    joined: new Date()
                };

                userService.updateClan(user._id, newClan, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'action-controller.js', func: 'confirmNewMember', message: 'Error saving user' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        // send email indicating they've been accepted
                        var emailMsg = {
                            subject: 'You have been accepted to ' + userMeta.current_clan.name,
                            message: CLAN_EMAILS.joinConfirmed.replace(/\[1\]/g, userMeta.current_clan.name).replace(/\[2\]/g, userMeta.ign),
                            from_user: {
                                user_id: authService.user.id,
                                ign: userMeta.ign,
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
                        messagelogService.save(userMeta.current_clan.clan_id, '[ign] accepted to the clan by ' + userMeta.ign, user.ign, 'member', function (err, msg) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'clan-controller.js', func: 'confirmNewMember', message: 'Error saving new member message in the log' } );
                                errorService.save(err, function() {});
                            }
                        });
                    }
                });
            }
        });        
    }

    function declineNewMember(userMeta, newUserId) {
        userService.getById(newUserId, function (err, user) {
            if (err) {
                err.stack_trace.unshift( { file: 'action-controller.js', func: 'declineNewMember', message: 'Error getting user for confirmation' } );
                errorService.save(err, function() {});
            }
            else {
                // send email indicating they've been declined
                var emailMsg = {
                    subject: 'You have been declined access to ' + userMeta.current_clan.name,
                    message: CLAN_EMAILS.joinDeclined.replace(/\[1\]/g, userMeta.current_clan.name),
                    from_user: {
                        user_id: authService.user.id,
                        ign: userMeta.ign,
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
                messagelogService.save(userMeta.current_clan.clan_id, '[ign] was declined by ' + userMeta.ign, user.ign, 'member', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'clan-controller.js', func: 'declineNewMember', message: 'Error saving declined member message in the log' } );
                        errorService.save(err, function() {});
                    }
                });
            }
        });        
    }    
}]);