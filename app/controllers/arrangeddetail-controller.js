'use strict';

/*
*   Controller for war history page
*/

angular.module('Clashtools.controllers')
.controller('ArrangedDetailCtrl', ['$rootScope', '$scope', '$window', '$routeParams', '$location', '$modal', 'ctSocket', 'moment', 'authService', 'sessionService', 'errorService', 'emailMessageService', 'messagelogService', 'clanService', 'arrangedWarService', 'CLAN_EMAILS',
function ($rootScope, $scope, $window, $routeParams, $location, $modal, ctSocket, moment, authService, sessionService, errorService, emailMessageService, messagelogService, clanService, arrangedWarService, CLAN_EMAILS) {

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

                        // pull members for dropdown
                        clanService.getMembers($scope.us.clan_id, 'all', function (err, members) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'arrangeddetail-controller.js', func: 'init', message: 'Error getting clan members' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                $scope.members = members;

                                // reset every time we load to update any changes to member weights
                                resetProfiles();
                                updateTotals();
                            }
                        });

                        // when there's a change, animate the changed row
                        ctSocket.on('arrangedwar:' + $scope.war._id + ':' + $scope.them.clan_id + ':change', function (data) {

                            // determine which (if any) members were added for animation
                            $scope.themChange = [];
                            for (var idx=0; idx<data.roster.length; idx++) {
                                $scope.themChange.push(false);
                                var found = false;
                                for (var idx2=0; idx2<$scope.them.roster.length; idx2++) {
                                    if (data.roster[idx].user_id &&
                                        $scope.them.roster[idx2].user_id &&
                                        $scope.them.roster[idx2].user_id == data.roster[idx].user_id) {
                                        found = true;
                                        break;
                                    }
                                }

                                if (!found && data.roster[idx].user_id) {
                                    $scope.themChange[idx] = true;
                                }
                            }

                            // their new roster is returned from the socket push, set it after changes have been captured
                            $scope.them = data;

                            // if roster grew or shrunk, make sure the UI reflects that
                            if ($scope.them.roster.length > $scope.us.roster.length) {
                                for (var idx=$scope.us.roster.length; idx<$scope.them.roster.length; idx++) {
                                    $scope.us.roster.push({});
                                }
                                $scope.war.roster_count = $scope.them.roster.length;
                            }
                            else if ($scope.them.roster.length < $scope.us.roster.length) {
                                $scope.us.roster.splice($scope.them.roster.length, $scope.us.roster.length-1);
                                $scope.war.roster_count = $scope.them.roster.length;
                            }

                            
                            // need to set the war correctly so when it saves the other clan's changes don't get hammered
                            if (war.clan_1.clan_id == $scope.meta.current_clan.clan_id) {
                                $scope.war.clan_2 = $scope.them;
                            }
                            else {
                                $scope.war.clan_1 = $scope.them;
                            }

                            updateTotals();
                        });
                    }
                });
            }
        }
    });

    $scope.changeRosterCount = function() {
        if ($scope.war.roster_count > $scope.us.roster.length) {
            // adding to roster, just extend the arrays for both teams
            for (var idx=$scope.us.roster.length; idx<$scope.war.roster_count; idx++) {
                $scope.us.roster.push({});
                $scope.them.roster.push({});
            }

            saveInternal();
        }
        else {
            // shortening roster - need to warn before removing names
            var cssClass = 'center';
            if ($window.innerWidth < 500) {
                cssClass = 'mobile';
            }

            $scope.modalOptions = {
                title: 'Shorten match roster count?',
                message: 'Please confirm you want to shorten the roster. If you select "Yes" any names that are cut off will be removed. You can\'t undo this action (for example, shortening from 30 to 25 will remove five names from the end of both rosters).',
                yesBtn: 'Yes',
                noBtn: 'Cancel',
                cssClass: cssClass,
                onYes: function() {
                    $scope.us.roster.splice($scope.war.roster_count, $scope.us.roster.length-1);
                    $scope.them.roster.splice($scope.war.roster_count, $scope.them.roster.length-1);
                    saveInternal();
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
    }

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
        saveInternal();
        cleanDisplayMembers();

    }

    $scope.removePlayer = function(index) {
        $scope.us.roster.splice(index, 1);
        $scope.us.roster.push({});
        saveInternal();
        cleanDisplayMembers();
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

    // whenever we load this page, let's reset the profiles to make sure to pick up any changes to weights, hero levels, or th
    function resetProfiles() {
        var changedSomething = false;
        for (var idx=0; idx<$scope.us.roster.length; idx++) {
            for (var idx2=0; idx2<$scope.members.length; idx2++) {
                if ($scope.us.roster[idx].user_id == $scope.members[idx2]._id) {
                    //
                    if ($scope.us.roster[idx].warWeight != $scope.members[idx2].profile.warWeight ||
                        $scope.us.roster[idx].bk != $scope.members[idx2].profile.heroes.bk ||
                        $scope.us.roster[idx].aq != $scope.members[idx2].profile.heroes.aq ||
                        $scope.us.roster[idx].th != $scope.members[idx2].profile.buildings.th) {
                        // something changed that impacts this view - update the values
                        changedSomething = true;
                        $scope.us.roster[idx].warWeight = $scope.members[idx2].profile.warWeight;
                        $scope.us.roster[idx].bk = $scope.members[idx2].profile.heroes.bk;
                        $scope.us.roster[idx].aq = $scope.members[idx2].profile.heroes.aq;
                        $scope.us.roster[idx].th = $scope.members[idx2].profile.buildings.th;
                    }
                    break;
                }
            }
        }


        angular.forEach($scope.members, function (member) {
            var heroes = member.profile.heroes.bk + member.profile.heroes.aq;
            member.displayName = member.profile.warWeight/1000 + ' | TH ' + member.profile.buildings.th + ' | Heroes ' + heroes + ' | ' + member.ign;
        });

        $scope.members.sort(function (a, b) {
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

        if (changedSomething) {
            $scope.us.roster.sort(function (a, b) {
                if (a.warWeight > b.warWeight) {
                    return -1;
                }
                else if (a.warWeight < b.warWeight) {
                    return 1;
                }
                else {
                    if (a.bk + a.aq > b.bk + b.aq) {
                        return -1;
                    }
                    else if (a.bk + a.aq < b.bk + b.aq) {
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
            saveInternal();
        }
        cleanDisplayMembers();
    }

    function cleanDisplayMembers() {
        $scope.displayMembers = [];
        for (var idx=0; idx<$scope.members.length; idx++) {
            var found = false;
            for (var idx2=0; idx2<$scope.us.roster.length; idx2++) {
                if ($scope.members[idx]._id == $scope.us.roster[idx2].user_id) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                $scope.displayMembers.push($scope.members[idx]);
            }
        }

        $scope.addedPlayer = {};
    }

    function saveInternal() {
        arrangedWarService.save($scope.meta.current_clan.clan_id, $scope.war, function (err, results) {
            if (err) {
                err.stack_trace.unshift( { file: 'arrangeddetail-controller.js', func: 'saveInternal', message: 'Error saving arranged war' } );
                errorService.save(err, function() {});
            }
            else {
                updateTotals();
            }
        });
    }

    function updateTotals() {
        $scope.totals = {
            us: {
                totalWeight: 0,
                totalBK: 0,
                totalAQ: 0,
                totalHeroes: 0,
                th10: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalHeroes: 0,                        
                },
                th9: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalHeroes: 0,                          
                },
                th8: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalHeroes: 0,                          
                }
            },
            them: {
                totalWeight: 0,
                totalBK: 0,
                totalAQ: 0,
                totalHeroes: 0,
                th10: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalHeroes: 0,                        
                },
                th9: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalHeroes: 0,                          
                },
                th8: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalHeroes: 0,                          
                }              
            }
        };

        angular.forEach($scope.us.roster, function (member) {
            if (member.user_id) {
                $scope.totals.us.totalWeight += member.warWeight;
                $scope.totals.us.totalBK += member.bk;
                $scope.totals.us.totalAQ += member.aq;
                $scope.totals.us.totalHeroes += member.bk + member.aq;

                if (member.th==10) {
                    $scope.totals.us.th10.totalWeight += member.warWeight;
                    $scope.totals.us.th10.totalBK += member.bk;
                    $scope.totals.us.th10.totalAQ += member.aq;
                    $scope.totals.us.th10.totalHeroes += member.bk + member.aq;                    
                }
                else if (member.th==9) {
                    $scope.totals.us.th9.totalWeight += member.warWeight;
                    $scope.totals.us.th9.totalBK += member.bk;
                    $scope.totals.us.th9.totalAQ += member.aq;
                    $scope.totals.us.th9.totalHeroes += member.bk + member.aq;                    
                } 
                else if (member.th==8) {
                    $scope.totals.us.th8.totalWeight += member.warWeight;
                    $scope.totals.us.th8.totalBK += member.bk;
                    $scope.totals.us.th8.totalAQ += member.aq;
                    $scope.totals.us.th8.totalHeroes += member.bk + member.aq;                    
                }                                
            }
        });

        angular.forEach($scope.them.roster, function (member) {
            if (member.user_id) {
                $scope.totals.them.totalWeight += member.warWeight;
                $scope.totals.them.totalBK += member.bk;
                $scope.totals.them.totalAQ += member.aq;
                $scope.totals.them.totalHeroes += member.bk + member.aq;

                if (member.th==10) {
                    $scope.totals.them.th10.totalWeight += member.warWeight;
                    $scope.totals.them.th10.totalBK += member.bk;
                    $scope.totals.them.th10.totalAQ += member.aq;
                    $scope.totals.them.th10.totalHeroes += member.bk + member.aq;                    
                }
                else if (member.th==9) {
                    $scope.totals.them.th9.totalWeight += member.warWeight;
                    $scope.totals.them.th9.totalBK += member.bk;
                    $scope.totals.them.th9.totalAQ += member.aq;
                    $scope.totals.them.th9.totalHeroes += member.bk + member.aq;                    
                } 
                else if (member.th==8) {
                    $scope.totals.them.th8.totalWeight += member.warWeight;
                    $scope.totals.them.th8.totalBK += member.bk;
                    $scope.totals.them.th8.totalAQ += member.aq;
                    $scope.totals.them.th8.totalHeroes += member.bk + member.aq;                    
                }                  
            }
        });
    }

}]);
