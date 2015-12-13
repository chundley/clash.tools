'use strict';

/*
*   Controller for war history page
*/

angular.module('Clashtools.controllers')
.controller('ArrangedDetailCtrl', ['$rootScope', '$scope', '$window', '$routeParams', '$location', '$modal', 'ctSocket', 'moment', 'authService', 'sessionService', 'errorService', 'emailMessageService', 'messagelogService', 'clanService', 'userService', 'arrangedWarService', 'CLAN_EMAILS', 'trackService',
function ($rootScope, $scope, $window, $routeParams, $location, $modal, ctSocket, moment, authService, sessionService, errorService, emailMessageService, messagelogService, clanService, userService, arrangedWarService, CLAN_EMAILS, trackService) {

    // needed for inline dropdown lists
    $scope.th = [];
    for (var idx=11; idx>0; idx--) {
        $scope.th.push(idx);
    }

    $scope.hl = [];
    for (var idx=40; idx>=0; idx--) {
        $scope.hl.push(idx);
    }

    $scope.wt = [];
    for (var idx=120; idx>=0; idx--) {
        $scope.wt.push(idx);
    }

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

    $scope.addToRoster = function(index, player) {
        if (player._id) {
            $scope.us.roster[index] = {
                user_id: player._id,
                ign: player.ign,
                th: player.profile.buildings.th,
                warWeight: player.profile.warWeight,
                bk: player.profile.heroes.bk,
                aq: player.profile.heroes.aq,
                gw: player.profile.heroes.gw
            };

            saveInternal();
            cleanDisplayMembers();
        }
        else {
            // placeholder
            var cssClass = 'center';
            if ($window.innerWidth < 500) {
                cssClass = 'mobile';
            }

            $scope.modalOptions = {
                yesBtn: 'Add',
                noBtn: 'Cancel',
                cssClass: cssClass,
                formData: {
                    warWeight: 0,
                    th: 1,
                    bk: 0,
                    aq: 0,
                    gw: 0,
                },
                onYes: function(formData) {

                    var newMember = {
                        user_id: 1,
                        ign: formData.ign,
                        th: formData.th,
                        warWeight: formData.warWeight,
                        bk: formData.bk,
                        aq: formData.aq,
                        gw: formData.gw
                    };
                    $scope.us.roster[index] = newMember;
                    saveInternal();
                    cleanDisplayMembers();
                    trackService.track('saved-arrangedph');

                }
            };

            var modalInstance = $modal(
                {
                    scope: $scope,
                    animation: 'am-fade-and-slide-top',
                    placement: 'center',
                    template: "/views/partials/arrangedPlaceholder.html",
                    show: false
                }
            );

            modalInstance.$promise.then(function() {
                modalInstance.show();
            });
        }
    }

    $scope.removePlayer = function(index) {
        $scope.us.roster.splice(index, 1);
        $scope.us.roster.push({});
        saveInternal();
        cleanDisplayMembers();
    }

    $scope.moveUp = function(index) {
        var temp = $scope.us.roster[index-1];
        $scope.us.roster[index-1] = $scope.us.roster[index];
        $scope.us.roster[index] = temp;
        saveInternal();
        cleanDisplayMembers();
    }

    $scope.moveDown = function(index) {
        var temp = $scope.us.roster[index+1];
        $scope.us.roster[index+1] = $scope.us.roster[index];
        $scope.us.roster[index] = temp;
        saveInternal();
        cleanDisplayMembers();
    }

    $scope.fillRoster = function() {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            title: 'Fill roster with clan members?',
            message: 'Selecting "Yes" will fill the war roster with members from your clan from highest war weight to lowest. This will overwrite the current roster.',
            yesBtn: 'Yes',
            noBtn: 'Cancel',
            cssClass: cssClass,
            onYes: function() {
                $scope.members.sort(function (a, b) {
                    if (a.profile.buildings.th > b.profile.buildings.th) {
                        return -1;
                    }
                    else if (a.profile.buildings.th < b.profile.buildings.th) {
                        return 1;
                    }
                    else {
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
                    }
                });

                for (var idx=0; idx<$scope.us.roster.length; idx++) {
                    if (idx < $scope.members.length) {
                        var newMember = {
                            user_id: $scope.members[idx]._id,
                            ign: $scope.members[idx].ign,
                            th: $scope.members[idx].profile.buildings.th,
                            warWeight: $scope.members[idx].profile.warWeight,
                            bk: $scope.members[idx].profile.heroes.bk,
                            aq: $scope.members[idx].profile.heroes.aq
                        };

                        $scope.us.roster[idx] = newMember;
                    }
                }
                saveInternal();
                updateTotals();
                $rootScope.globalMessage = 'The roster has been filled with your team';
                trackService.track('filled-arrangedroster');
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

    $scope.updatePlayerData = function(index, player) {
        if (player.user_id.length == 24) {
            // real player, update accordingly
            var model = {
                th: player.th,
                w: player.warWeight,
                bk: player.bk,
                aq: player.aq
            }

            userService.updateFromRoster(player.user_id, model, function (err, user) {
                if (err) {
                    err.stack_trace.unshift( { file: 'arrangeddetail-controller.js', func: '$scope.updatePlayerData', message: 'Error updating roster data' } );
                    errorService.save(err, function() {});
                }
                else {

                    // need to update local members array
                    for (var idx=0; idx<$scope.members.length; idx++) {
                        if ($scope.members[idx]._id == player.user_id) {
                            $scope.members[idx].profile.buildings.th = player.th;
                            $scope.members[idx].profile.warWeight = player.warweight;
                            $scope.members[idx].profile.heroes.bk = player.bk;
                            $scope.members[idx].profile.heroes.aq = player.aq;
                            break;
                        }
                    }

                    $scope.us.roster[index].th = player.th;
                    $scope.us.roster[index].warWeight = player.warWeight;
                    $scope.us.roster[index].bk = player.bk;
                    $scope.us.roster[index].aq = player.aq;

                    sortRoster();
                    cleanDisplayMembers();
                    saveInternal();
                    $rootScope.globalMessage = 'Member profile updated';
                }
            });
        }
        else {
            $scope.us.roster[index].th = player.th;
            $scope.us.roster[index].warWeight = player.warWeight;
            $scope.us.roster[index].bk = player.bk;
            $scope.us.roster[index].aq = player.aq;
            sortRoster();
            cleanDisplayMembers();
            saveInternal();
        }
    }

    $scope.search = function(terms) {
        if (terms.length > 0) {
            trackService.track('search-arrangedwar', { "term": terms } );
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
                        trackService.track('started-arrangedwar', { "clan": clan.name } );
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
            member.displayName = member.profile.warWeight + ' | TH ' + member.profile.buildings.th + ' | Heroes ' + heroes + ' | ' + member.ign;
        });

        $scope.members.sort(function (a, b) {
            if (a.profile.buildings.th > b.profile.buildings.th) {
                return -1;
            }
            else if (a.profile.buildings.th < b.profile.buildings.th) {
                return 1;
            }
            else {
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
                        if (a.ign && b.ign) {
                            if (a.ign < b.ign) {
                                return -1;
                            }
                            else {
                                return 1;
                            }
                        }
                        else {
                            if (!b.ign) {
                                return -1;
                            }
                            else {
                                return 1;
                            }
                        }
                    }
                }
            }
        });

        if (changedSomething) {
            sortRoster();
            saveInternal();
        }
        cleanDisplayMembers();
    }

    function sortRoster() {
        $scope.us.roster.sort(function (a, b) {
            if (a.th > b.th) {
                return -1;
            }
            else if (a.th < b.th) {
                return 1;
            }
            else {
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
                        if (a.ign && b.ign) {
                            if (a.ign < b.ign) {
                                return -1;
                            }
                            else {
                                return 1;
                            }
                        }
                        else {
                            if (!b.ign) {
                                return -1;
                            }
                            else {
                                return 1;
                            }
                        }
                    }
                }
            }
        });
    }

    function cleanDisplayMembers() {
        $scope.displayMembers = [];

        var placeHolder = {
            _id: null,
            ign: '',
            profile: {
                warWeight: 0,
                buildings: {
                    th: 1
                },
                heroes: {
                    bk: 0,
                    aq: 0
                }
            },
            displayName: '[ Add Placeholder Member ]'
        };
        $scope.displayMembers.push(placeHolder);


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


        //$scope.addedPlayer = -1;
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
                totalGW: 0,
                totalHeroes: 0,
                th11: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalGW: 0,
                    totalHeroes: 0,
                },
                th10: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalGW: 0,
                    totalHeroes: 0,
                },
                th9: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalGW: 0,
                    totalHeroes: 0,
                },
                th8: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalGW: 0,
                    totalHeroes: 0,
                }
            },
            them: {
                totalWeight: 0,
                totalBK: 0,
                totalAQ: 0,
                totalGW: 0,
                totalHeroes: 0,
                th11: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalGW: 0,
                    totalHeroes: 0,
                },
                th10: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalGW: 0,
                    totalHeroes: 0,
                },
                th9: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalGW: 0,
                    totalHeroes: 0,
                },
                th8: {
                    totalWeight: 0,
                    totalBK: 0,
                    totalAQ: 0,
                    totalGW: 0,
                    totalHeroes: 0,
                }
            }
        };

        angular.forEach($scope.us.roster, function (member) {
            if (member.user_id) {
                $scope.totals.us.totalWeight += member.warWeight;
                $scope.totals.us.totalBK += member.bk;
                $scope.totals.us.totalAQ += member.aq;
                $scope.totals.us.totalGW += member.gw;
                $scope.totals.us.totalHeroes += member.bk + member.aq + member.gw;

                if (member.th==11) {
                    $scope.totals.us.th11.totalWeight += member.warWeight;
                    $scope.totals.us.th11.totalBK += member.bk;
                    $scope.totals.us.th11.totalAQ += member.aq;
                    $scope.totals.us.th11.totalGW += member.gw;
                    $scope.totals.us.th11.totalHeroes += member.bk + member.aq + member.gw;
                }
                else if (member.th==10) {
                    $scope.totals.us.th10.totalWeight += member.warWeight;
                    $scope.totals.us.th10.totalBK += member.bk;
                    $scope.totals.us.th10.totalAQ += member.aq;
                    $scope.totals.us.th10.totalGW += member.gw;
                    $scope.totals.us.th10.totalHeroes += member.bk + member.aq + member.gw;
                }
                else if (member.th==9) {
                    $scope.totals.us.th9.totalWeight += member.warWeight;
                    $scope.totals.us.th9.totalBK += member.bk;
                    $scope.totals.us.th9.totalAQ += member.aq;
                    $scope.totals.us.th9.totalGW += member.gw;
                    $scope.totals.us.th9.totalHeroes += member.bk + member.aq + member.gw;
                }
                else if (member.th==8) {
                    $scope.totals.us.th8.totalWeight += member.warWeight;
                    $scope.totals.us.th8.totalBK += member.bk;
                    $scope.totals.us.th8.totalAQ += member.aq;
                    $scope.totals.us.th9.totalGW += member.gw;
                    $scope.totals.us.th8.totalHeroes += member.bk + member.aq + member.gw;
                }
            }
        });

        angular.forEach($scope.them.roster, function (member) {
            if (member.user_id) {
                $scope.totals.them.totalWeight += member.warWeight;
                $scope.totals.them.totalBK += member.bk;
                $scope.totals.them.totalAQ += member.aq;
                $scope.totals.them.totalGW += member.gw;
                $scope.totals.them.totalHeroes += member.bk + member.aq + member.gw;

                if (member.th==11) {
                    $scope.totals.them.th11.totalWeight += member.warWeight;
                    $scope.totals.them.th11.totalBK += member.bk;
                    $scope.totals.them.th11.totalAQ += member.aq;
                    $scope.totals.them.th11.totalGW += member.gw;
                    $scope.totals.them.th11.totalHeroes += member.bk + member.aq + member.gw;
                }
                else if (member.th==10) {
                    $scope.totals.them.th10.totalWeight += member.warWeight;
                    $scope.totals.them.th10.totalBK += member.bk;
                    $scope.totals.them.th10.totalAQ += member.aq;
                    $scope.totals.them.th10.totalGW += member.gw;
                    $scope.totals.them.th10.totalHeroes += member.bk + member.aq + member.gw;
                }
                else if (member.th==9) {
                    $scope.totals.them.th9.totalWeight += member.warWeight;
                    $scope.totals.them.th9.totalBK += member.bk;
                    $scope.totals.them.th9.totalAQ += member.aq;
                    $scope.totals.them.th9.totalGW += member.gw;
                    $scope.totals.them.th9.totalHeroes += member.bk + member.aq + member.gw;
                }
                else if (member.th==8) {
                    $scope.totals.them.th8.totalWeight += member.warWeight;
                    $scope.totals.them.th8.totalBK += member.bk;
                    $scope.totals.them.th8.totalAQ += member.aq;
                    $scope.totals.them.th9.totalGW += member.gw;
                    $scope.totals.them.th8.totalHeroes += member.bk + member.aq + member.gw;
                }
            }
        });
    }
}]);
