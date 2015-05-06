'use strict';

/*
*   Controller for clan members page
*/

angular.module('Clashtools.controllers')
.controller('MembersCtrl', ['$rootScope', '$scope', '$window', '$routeParams', '$location', '$modal', 'moment', 'authService', 'sessionService', 'errorService', 'emailMessageService', 'messagelogService', 'clanService', 'userService', 'CLAN_EMAILS',
function ($rootScope, $scope, $window, $routeParams, $location, $modal, moment, authService, sessionService, errorService, emailMessageService, messagelogService, clanService, userService, CLAN_EMAILS) {

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'members-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;
            $scope.clan = meta.current_clan;
            $scope.userId = authService.user.id;
            $rootScope.title = meta.current_clan.name + ' clan members';   
            clanService.getMembers($scope.clan.clan_id, 'all', function (err, members) {
                if (err) {
                    err.stack_trace.unshift( { file: 'members-controller.js', func: 'init', message: 'Error getting clan members' } );
                    errorService.save(err, function() {});
                }
                else {
                    angular.forEach(members, function (member) {
                        member.joined = new moment(member.current_clan.joined);
                    });
                    $scope.members = members;
                }
            });
        }        
    });

    $scope.changeRole = function(member, role, pd) {
        userService.updateRole(member._id, role, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'members-controller.js', func: '$scope.changeRole', message: 'Error changing member role' } );
                errorService.save(err, function() {});
            }
            else {
                messagelogService.save($scope.clan.clan_id, '[ign] ' + pd + ' to ' + role +' by ' + $scope.meta.ign, member.ign, 'member', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'members-controller.js', func: '$scope.kick', message: 'Error saving new clan message in the log' } );
                        errorService.save(err, function() {});
                    }
                }); 
                               
                angular.forEach($scope.members, function (m) {
                    if (role=='leader') {
                        // promoting a new leader, demote existing leader
                        if (m.role.title == 'leader') {
                            m.role = { bitMask: 8, title: 'coleader' };
                        }
                    }

                    if (m._id == member._id) {
                        member.role = result.role;
                    }
                });
            }
        });
    }

    $scope.kick = function(member) {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }
        
        $scope.modalOptions = {
            title: 'Kick ' + member.ign + '?',
            message: 'Please confirm you want to kick "' + member.ign + '" from ' + $scope.clan.name,
            yesBtn: 'Kick',
            noBtn: 'Cancel',
            cssClass: cssClass,
               onYes: function() {
                // need to send app emails to leaders and coleaders
                userService.updateClan(member._id, {}, function (err, m) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'members-controller.js', func: '$scope.kick', message: 'Error saving new clan message in the log' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        // Log this activity
                        messagelogService.save($scope.clan.clan_id, '[ign] was kicked by ' + $scope.meta.ign, member.ign, 'member', function (err, msg) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'members-controller.js', func: '$scope.kick', message: 'Error saving new clan message in the log' } );
                                errorService.save(err, function() {});
                            }
                        });

                        var emailMsg = {
                            subject: 'You have been kicked from  ' + $scope.clan.name,
                            message: CLAN_EMAILS.kicked.replace(/\[1\]/g, $scope.ign),
                            from_user: {
                                user_id: authService.user.id,
                                ign: $scope.meta.ign,
                                deleted: false
                            },
                            to_users: [
                                {
                                    user_id: member._id,
                                    ign: member.ign,
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
                    }
                });
                
                // remove the user from the clan in the UI
                var removeIndex = -1;
                for (var idx=0; idx<$scope.members.length; idx++) {
                    if ($scope.members[idx]._id == member._id) {
                        removeIndex = idx;
                    }
                }
                if (removeIndex >= 0) {
                    $scope.members.splice(removeIndex, 1);
                }
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/confirmDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

}]);
