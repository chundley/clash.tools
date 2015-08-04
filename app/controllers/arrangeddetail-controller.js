'use strict';

/*
*   Controller for war history page
*/

angular.module('Clashtools.controllers')
.controller('ArrangedDetailCtrl', ['$rootScope', '$scope', '$window', '$routeParams', '$location', '$modal', 'moment', 'authService', 'sessionService', 'errorService', 'emailMessageService', 'messagelogService', 'clanService', 'arrangedWarService', 'CLAN_EMAILS',
function ($rootScope, $scope, $window, $routeParams, $location, $modal, moment, authService, sessionService, errorService, emailMessageService, messagelogService, clanService, arrangedWarService, CLAN_EMAILS) {

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'arrangeddetail-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;
            $scope.userId = authService.user.id;
            $rootScope.title = meta.current_clan.name + ' arranged war';

            if ($routeParams.id == 'new') {
                $scope.newWar = true;
            }
            else {
                $scope.newWar = false;
                // existing arranged war - get the details
                arrangedWarService.get($routeParams.id, function (err, war) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'arrangeddetail-controller.js', func: 'init', message: 'Error getting war' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        console.log(war);
                        $scope.war = war;
                        if (war.clan_1.clan_id == $scope.meta.current_clan.clan_id) {
                            $scope.us = war.clan_1; 
                            $scope.them = war.clan_2;
                        }
                        else {
                            $scope.us = war.clan_2;
                            $scope.them = war.clan_1;
                        }

                        clanService.getMembers($scope.us.clan_id, 'all', function (err, members) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'arrangeddetail-controller.js', func: 'init', message: 'Error getting clan members' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                angular.forEach(members, function (member) {
                                    var heroes = member.profile.heroes.bk + member.profile.heroes.aq;
                                    member.displayName = member.ign + ' | W-' + member.profile.warWeight/1000 + ' | TH-' + member.profile.buildings.th + ' | H-' + heroes;
                                });
                                $scope.members = members;
                                console.log($scope.members);
                            }
                        });
                    }
                });
            }
        }
    });

    $scope.addPlayer = function(player) {
        console.log(player);

        // find the slot where this member should go


    }

    $scope.search = function(terms) {
        if (terms.length > 0) {
            clanService.allClans(terms, 20, function (err, clans) {
                $scope.clans = clans;
            });
        }
    }

    $scope.startMatch = function(clan) {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            title: 'Start an arranged war with ' + clan.name + '?',
            message: 'Please confirm you want start an arranged war with "' + clan.name + '". The match will be created and the leaders of the other clan will be notified.',
            yesBtn: 'Start',
            noBtn: 'Cancel',
            cssClass: cssClass,
            onYes: function() {

                var emailMsg = {
                    subject: $scope.meta.current_clan.name + ' would like to set up an arranged war',
                    message: CLAN_EMAILS.arranged.replace(/\[1\]/g, $scope.meta.current_clan.name),
                    from_user: {
                        user_id: null, // looks screwey if in the outbox
                        ign: $scope.ign,
                        deleted: false
                    },
                    to_users: []
                };

                var metaData = {
                    clan_1: {
                        clan_id: $scope.meta.current_clan.clan_id,
                        clan_name: $scope.meta.current_clan.name,
                        clan_tag: $scope.meta.current_clan.clan_tag
                    },
                    clan_2: {
                        clan_id: clan._id,
                        clan_name: clan.name,
                        clan_tag: clan.clan_tag
                    },
                    email: emailMsg
                };

                clanService.arrangedRequest($scope.meta.current_clan.clan_id, metaData, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'arrangeddetail-controller.js', func: '$scope.startMatch', message: 'Error with start arranged match request' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        $rootScope.globalMessage = 'Your request for an arranged war with "' + clan.name + '" has been sent.';
                    }
                });

                $location.url('/arranged').replace();
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
