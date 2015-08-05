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
                                    member.displayName = member.profile.warWeight/1000 + ' | TH ' + member.profile.buildings.th + ' | Heroes ' + heroes + ' | ' + member.ign;
                                });

                                members.sort(function (a, b) {
                                    if (a.profile.warWeight > b.profile.warWeight) {
                                        return -1;
                                    }
                                    else if (a.profile.warWeight < b.profile.warWeight) {
                                        return 1;
                                    }
                                    else {
                                        if (a.profile.heroes.bk + a.profile.heroes.aq > b.profile.heroes.bk + b.profile.heroes.aq) {
                                            return -1;
                                        }
                                        else if (a.profile.heroes.bk + a.profile.heroes.aq < b.profile.heroes.bk + b.profile.heroes.aq) {
                                            return 1;
                                        }
                                        else {
                                            if (a.ign < b.ign) {
                                                return -1;
                                            }
                                            else {
                                                return 1;
                                            }
                                        }
                                    }
                                });

                                $scope.members = members;
                            }
                        });
                    }
                });
            }
        }
    });

    $scope.addPlayer = function(player) {
        // find the slot where this member should go
        var position = -1;

        for (var idx=0; idx<$scope.us.roster.length; idx++) {
            if ($scope.us.roster[idx].user_id &&
                $scope.us.roster[idx].warWeight <= player.profile.warWeight) {
                // if a user at this location and the user's weight is less than or equal to new player, do something
                if ($scope.us.roster[idx].warWeight == player.profile.warWeight) {
                    // if equal, check hero levels
                    if ($scope.us.roster[idx].bk + $scope.us.roster[idx].aq <= player.profile.heroes.bk + player.profile.heroes.aq) {
                        position = idx;
                        break;
                    }
                }
                else {
                    position = idx;
                    break;
                }

            }
            else if (!$scope.us.roster[idx].user_id) {
                position = idx;
                break;
            }
        }

        if (position >= 0) {
            var newMember = {
                user_id: player._id,
                ign: player.ign,
                th: player.profile.buildings.th,
                warWeight: player.profile.warWeight,
                bk: player.profile.heroes.bk,
                aq: player.profile.heroes.aq
            };

            if (position == $scope.us.roster.length-1) {
                // last position in the array, just replace what's there
                $scope.us.roster[position] = newMember;
            }
            else {
                // need to move everyone down a spot (5 becomes 6, 6 becomes 7, etc.)
                for (var moveIdx = $scope.us.roster.length-1; moveIdx > position; moveIdx--) {
                    $scope.us.roster.splice(moveIdx, 0, $scope.us.roster.splice(moveIdx-1, 1)[0]);

                    //this.splice(to, 0, this.splice(from, 1)[0]);
                }
                $scope.us.roster[position] = newMember;
            }
        }
        console.log($scope.war);

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
