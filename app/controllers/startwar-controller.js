'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('StartWarCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$window', '$modal', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'warService', 'userService', 'utils', 'trackService',
function ($rootScope, $scope, $routeParams, $location, $window, $modal, authService, sessionService, errorService, messagelogService, clanService, warService, userService, utils, trackService) {

    var warId = $routeParams.id;

    $scope.newWar = true;
    $scope.warStarted = false;
    $scope.cascade = true;

    // needed for inline dropdown lists
    $scope.th = [];
    for (var idx=10; idx>0; idx--) {
        $scope.th.push(idx);
    }

    $scope.hl = [];
    for (var idx=40; idx>=0; idx--) {
        $scope.hl.push(idx);
    }

    $scope.wt = [];
    for (var idx=100; idx>=0; idx--) {
        $scope.wt.push(idx);
    }

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'startwar-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;

            clanService.getMembers($scope.meta.current_clan.clan_id, 'all', function (err, members) {


                if (err) {
                    err.stack_trace.unshift( { file: 'startwar-controller.js', func: 'init', message: 'Error getting clan members' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.members = members;
                    var now = new Date();

                    // set hero status for members
                    angular.forEach($scope.members, function (member) {
                        var bkFinishTime = new Date(member.profile.bkUpgrade);
                        bkFinishTime = bkFinishTime.getTime();

                        if (bkFinishTime > now.getTime()) {
                            var hoursLeft = parseInt((bkFinishTime - now.getTime())/1000/60/60);
                            member.bkDays = parseInt(hoursLeft / 24);
                            member.bkHours = parseInt(hoursLeft % 24);
                        }
                        else {
                            member.bkDays = 0;
                            member.bkHours = 0;
                        }

                        var aqFinishTime = new Date(member.profile.aqUpgrade);
                        aqFinishTime = aqFinishTime.getTime();

                        if (aqFinishTime > now.getTime()) {
                            var hoursLeft = parseInt((aqFinishTime - now.getTime())/1000/60/60);
                            member.aqDays = parseInt(hoursLeft / 24);
                            member.aqHours = parseInt(hoursLeft % 24);
                        }
                        else {
                            member.aqDays = 0;
                            member.aqHours = 0;
                        }
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


                    if (warId !== 'new') {
                        warService.getById(warId, function (err, war) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'startwar-controller.js', func: 'init', message: 'Error getting user meta' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                $scope.war = war;
                                $scope.newWar = false;

                                // start the countdown timer to show it's working
                                var now = new Date();
                                var start = new Date(war.start);
                                $scope.warStartTime = start.getTime();
                                $scope.warEndTime = null;
                                $scope.$broadcast('timer-start');
                                $rootScope.title = 'Clan war vs: ' + war.opponent_name + ' - clash.tools';

                                if (now.getTime() > start.getTime()) {
                                    $scope.warStarted = true;
                                    $scope.warStartTime = null;
                                    $scope.warEndTime = new Date(start.getTime() + (24*60*60*1000));
                                }

                                // add placeholder members so the dropdowns work
                                // little big of a hack, but user id's from placeholders have a '-' in them
                                angular.forEach($scope.war.team, function (tm) {
                                    if (tm.u != null && tm.u.indexOf('-') >= 0) {
                                        $scope.members.push(
                                            {
                                                _id: tm.u,
                                                ign: tm.i,
                                                profile: {
                                                    buildings: {
                                                        th: tm.t
                                                    }
                                                }
                                            }
                                        );
                                    }
                                });

                                updateInterface();
                            }
                        });
                    }
                    else {
                        $scope.newWar = true;
                        var warStart = new Date();
                        warStart = new Date(warStart.getTime() + (24*60*60*1000));
                        $scope.war = {
                            clan_id: $scope.meta.current_clan.clan_id,
                            active: true,
                            visible: false, // not used currently
                            opponent_name: '',
                            opponent_tag: '',
                            player_count: 30,
                            start: warStart,
                            plan: '',
                            bases: [],
                            team: [],
                            result: {
                                stars: 0,
                                opponentStars: 0,
                                result: 1 // 0 = loss, 1 = win, 2 = tie
                            },
                            created_by: authService.user.id
                        };

                        for (var b=0; b<30; b++) {
                            $scope.war.bases.push(
                                {
                                    b: b+1,
                                    t: 1,
                                    a: []
                                }
                            );

                            $scope.war.team.push(
                                {
                                    b: b+1,
                                    t: 1,
                                    u: null,
                                    i: ''
                                }
                            );
                        }
                        $rootScope.title = 'New war - clash.tools';
                    }
                }
            });

            clanService.getById($scope.meta.current_clan.clan_id, function (err, clan) {
                if (err) {
                    err.stack_trace.unshift( { file: 'startwar-controller.js', func: 'init', message: 'Error getting clan' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.clan = clan;
                }
            });
        }
    });

    /*
    *   When changing player count, salvage any possible work that's already been done
    */
    $scope.changePlayerCount = function() {
        var oldBases = $scope.war.bases;
        var oldTeam = $scope.war.team;

        $scope.war.bases = [];
        $scope.war.team = [];

        for (var b=0; b<$scope.war.player_count; b++) {
            if (oldBases[b]) {
                $scope.war.bases[b] = oldBases[b];
                $scope.war.team[b] = oldTeam[b];
            }
            else {
                $scope.war.bases[b] = {
                    b: b+1,
                    t: 1,
                    a: []
                };

                $scope.war.team[b] = {
                    b: b+1,
                    t: 1,
                    u: null,
                    i: ''
                };
            }
        }
    }

    $scope.setStartTime = function() {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        var now = new Date();
        var currentStart = new Date($scope.war.start);
        var startEnd = 'startsIn';
        if (now > currentStart) {
            // war has already started
            startEnd = 'endsIn';
        }
        else {
            // war hasn't started

        }

        $scope.modalOptions = {
            yesBtn: 'Set',
            noBtn: 'Cancel',
            cssClass: cssClass,
            formData: {
                startEnd: startEnd
            },
            onYes: function(formData) {
                var now = new Date();

                if (formData.startEnd == 'startsIn') {
                    $scope.war.start = new Date(now.getTime() + ((formData.hours*60 + formData.minutes)*60000));
                    $scope.warStartTime = $scope.war.start.getTime();
                    $scope.warEndTime = null;
                    $scope.$broadcast('timer-start');

                    // need to re-set any assignment expirations
                    angular.forEach($scope.war.bases, function (base) {
                        angular.forEach(base.a, function (assignment) {
                            assignment.e = new Date($scope.war.start.getTime() + ($scope.clan.war_config.first_attack_time * 60 * 60 * 1000));
                        });
                    });
                }
                else {
                    $scope.war.start = new Date(now.getTime() - ((24*60*60*1000) -  ((formData.hours*60 + formData.minutes)*60000) ));
                    $scope.warStartTime = null
                    $scope.warEndTime = new Date($scope.war.start.getTime() + (24*60*60*1000));
                    var freeForAllDate = new Date($scope.war.start.getTime() + ((24 - $scope.clan.war_config.free_for_all_time)*60*60*1000));
                    var warEnd = new Date($scope.war.start.getTime() + (24*60*60*1000));

                    // calculate possible expire date on cleanup attacks
                    var possibleExpireDate = new Date(now.getTime() + ($scope.clan.war_config.cleanup_attack_time*60*60*1000));

                    var expireDate = null;
                    if (now.getTime() >= freeForAllDate.getTime()) {
                        // already passed the free for all time
                        expireDate = null;
                    }

                    else if (possibleExpireDate.getTime() >= warEnd) {
                        // possible expire date is already greater than war end
                        expireDate = warEnd;
                    }
                    else {
                        expireDate = possibleExpireDate;
                    }


                    $scope.$broadcast('timer-start');

                    // need to re-set any assignment expirations
                    angular.forEach($scope.war.bases, function (base) {
                        for (var idx=0; idx<base.a.length; idx++) {
                            if (base.a[idx].s == null) {
                                // only update attacks that haven't logges stars
                                if (idx == 0) {
                                    // for first attacks, set expired to
                                    base.a[idx].e = new Date($scope.war.start.getTime() + ($scope.clan.war_config.first_attack_time * 60 * 60 * 1000));
                                }
                                else {
                                    // re-set to standard expiration based on clan settings
                                    base.a[idx].e = expireDate;
                                }
                            }
                        }
                    });

                }

                trackService.track('set-wartimer');
                $scope.warSettingsForm.$setDirty();
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/warStartDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

    $scope.numBases = function() {
        return new Array($scope.war.player_count);
    }

    $scope.assignMirrors = function() {

        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            title: 'Assign all members to their mirror?',
            message: 'Please confirm you want to assign all members on the roster to their mirror target. This will overwrite any assignments you\'ve already got set.',
            yesBtn: 'Assign Mirrors',
            noBtn: 'Cancel',
            cssClass: cssClass,
            onYes: function() {
                for (var idx=0; idx<$scope.war.bases.length; idx++) {
                    if ($scope.war.team[idx] && $scope.war.team[idx].u) {
                        assignInternal(idx, $scope.war.team[idx].u);
                    }
                }
                saveWarInternal(function(){});
                trackService.track('assigned-mirrors');
                $rootScope.globalMessage = 'Mirror assignments saved.';
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

    $scope.assignBase = function(baseNum, userId) {
        assignInternal(baseNum, userId);
        saveWarInternal(function(){});
    }

    /*
    *   Internal function - because we don't want to save on mass assignments (like mirror)
    */
    function assignInternal(baseNum, userId) {
        var startTime = new Date($scope.war.start);
        var expires = new Date(startTime.getTime() + ($scope.clan.war_config.first_attack_time * 60 * 60 * 1000));
        for (var idx=0; idx<$scope.members.length; idx++) {
            if ($scope.members[idx]._id == userId) {
                $scope.war.bases[baseNum].a[0] = {
                    u: $scope.members[idx]._id,
                    i: $scope.members[idx].ign,
                    c: new Date(),
                    e: expires,
                    s: null,
                };
                break;
            }
        }
    }

    $scope.addToRoster = function(index, player) {
        if (player._id) {
            $scope.war.team[index] = {
                b: index+1,
                t: player.profile.buildings.th,
                u: player._id,
                i: player.ign
            };

            saveWarInternal(function(){});
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
                },
                onYes: function(formData) {
                    $scope.war.team[index] = {
                        b: index+1,
                        t: formData.th,
                        u: utils.createGUID(),
                        i: formData.ign
                    };
                    saveWarInternal(function(){});
                }
            };

            var modalInstance = $modal(
                {
                    scope: $scope,
                    animation: 'am-fade-and-slide-top',
                    placement: 'center',
                    template: "/views/partials/placeholderMember.html",
                    show: false
                }
            );

            modalInstance.$promise.then(function() {
                modalInstance.show();
            });
        }
    }

    $scope.removePlayer = function(index) {
        $scope.war.team[index] =
            {
                b: index+1,
                t: 1,
                u: null,
                i: ''
            };

        saveWarInternal(function(){});
    }

    $scope.moveUp = function(index) {
        var temp = $scope.war.team[index-1];
        $scope.war.team[index-1] = $scope.war.team[index];
        $scope.war.team[index] = temp;
        saveWarInternal(function(){});
    }

    $scope.moveDown = function(index) {
        var temp = $scope.war.team[index+1];
        $scope.war.team[index+1] = $scope.war.team[index];
        $scope.war.team[index] = temp;

        saveWarInternal(function(){});
    }

    $scope.fillByWeight = function() {
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

                for (var idx=0; idx<$scope.war.team.length; idx++) {
                    if ($scope.members[idx]) {
                        var teamMember = {
                            b: idx+1,
                            t: $scope.members[idx].profile.buildings.th,
                            u: $scope.members[idx]._id,
                            i: $scope.members[idx].ign
                        };

                        $scope.war.team[idx] = teamMember;
                    }
                    else {
                        $scope.war.team[idx] = {
                            b: idx+1,
                            t: 1,
                            u: null,
                            i: ''
                        };
                    }
                }
                saveWarInternal(function(){});
                $rootScope.globalMessage = 'The roster has been filled with your team';
                trackService.track('filled-autobyweight');
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

    $scope.fillFromLast = function() {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            title: 'Fill roster with members from the previous war?',
            message: 'Selecting "Yes" will fill the war roster with members from your previous war. This will overwrite the current roster.',
            yesBtn: 'Yes',
            noBtn: 'Cancel',
            cssClass: cssClass,
            onYes: function() {
                warService.getHistory($scope.meta.current_clan.clan_id, function (err, history) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'startwar-controller.js', func: '$scope.fillFromLast', message: 'Error getting war history' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        if (history && history.length > 0) {
                            warService.getById(history[0]._id, function (err, previousWar) {
                                if (err) {
                                    err.stack_trace.unshift( { file: 'startwar-controller.js', func: '$scope.fillFromLast', message: 'Error getting previous war' } );
                                    errorService.save(err, function() {});
                                }
                                else {
                                    for (var idx=0; idx<$scope.war.team.length; idx++) {
                                        var added = false;
                                        if (previousWar.team[idx]) {
                                            // make sure this person is still a member of the clan
                                            for (var idxM=0; idxM < $scope.members.length; idxM++) {
                                                if (previousWar.team[idx].u == $scope.members[idxM]._id) {
                                                    $scope.war.team[idx] = previousWar.team[idx];
                                                    added = true;
                                                    break;
                                                }
                                            }
                                        }

                                        // either this war is bigger, or a member left the clan, add an empty
                                        if (!added) {
                                            $scope.war.team[idx] = {
                                                b: idx+1,
                                                t: 1,
                                                u: null,
                                                i: ''
                                            };
                                        }
                                    }

                                    saveWarInternal(function(){});
                                    $rootScope.globalMessage = "Roster was filled from last war.";
                                }
                            });
                        }
                        else {
                            $rootScope.globalMessage = "You do not have any wars logged yet.";
                        }
                    }
                });
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
        if (player.u.length == 24) {
            // real player, update accordingly
            var model = {
                th: player.th,
                w: player.w,
                bk: player.bk,
                aq: player.aq
            }

            userService.updateFromRoster(player.u, model, function (err, user) {
                if (err) {
                    err.stack_trace.unshift( { file: 'startwar-controller.js', func: '$scope.updatePlayerData', message: 'Error updating roster data' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.war.team[index].t = player.th;


                    for (var idx=0; idx<$scope.members.length; idx++) {
                        if ($scope.members[idx]._id == player.u) {
                            $scope.members[idx].profile.buildings.th = player.th;
                            $scope.members[idx].profile.warWeight = player.w;
                            $scope.members[idx].profile.heroes.bk = player.bk;
                            $scope.members[idx].profile.heroes.aq = player.aq;
                            break;
                        }
                    }
                    saveWarInternal(function(){});
                    $rootScope.globalMessage = 'Member profile updated';
                }
            });
        }
    }

    $scope.deleteAssignment = function(baseNum) {
        $scope.war.bases[baseNum].a = [];
        saveWarInternal(function(){});
    }

    $scope.saveWarFeedback = function() {
        saveWarInternal(function(){
            if ($scope.war._id) {
                $rootScope.globalMessage = 'War saved.';
            }
            else {
                $rootScope.globalMessage = 'A new war was already started by someone else.'
            }
        });
    }

    $scope.saveWar = function() {
        saveWarInternal(function(){});
    }

    $scope.oppTH = function(baseNum) {
        if ($scope.cascade) {
            // cascade changes to TH level down
            for (var idx=baseNum; idx<$scope.war.bases.length; idx++) {
                $scope.war.bases[idx].t = $scope.war.bases[baseNum-1].t;
            }
        }
        saveWarInternal(function(){});
    }

    // no idea why model binding isn't working right for this checkbox, but it isn't
    $scope.wtf = function() {
        $scope.cascade = !$scope.cascade;
    }

    /*
    *   Disables the timer when editing war start
    */
    $scope.stopTimer = function() {
        $scope.$broadcast('timer-stop');
    }

    $scope.filterTeam = function(tm) {
        if (tm && tm.i.length > 0) {
            return true;
        }
        else {
            return false;
        }
    }

    function updateInterface() {
        $scope.heroesUpgrading = [];
        $scope.roster = [];

        // set up roster for display
        for (var teamIdx=0; teamIdx<$scope.war.team.length; teamIdx++) {
            var found = false;
            var rosterMember = {};
            if ($scope.war.team[teamIdx].u && $scope.war.team[teamIdx].u.length == 24) {
                for (var idx=0; idx<$scope.members.length; idx++) {
                    if ($scope.members[idx]._id == $scope.war.team[teamIdx].u) {
                        found = true;
                        rosterMember = {
                            u: $scope.members[idx]._id,
                            ign: $scope.members[idx].ign,
                            b: teamIdx + 1,
                            th: $scope.war.team[teamIdx].t,//$scope.members[idx].profile.buildings.th,
                            w: $scope.members[idx].profile.warWeight,
                            bk: $scope.members[idx].profile.heroes.bk,
                            aq: $scope.members[idx].profile.heroes.aq,
                            editable: true
                        };


                        // set hero upgrade status on base
                        if ($scope.members[idx].bkDays > 0 || $scope.members[idx].bkHours > 0) {
                            rosterMember.bkDown = { days: $scope.members[idx].bkDays, hours: $scope.members[idx].bkHours};
                        }
                        else {
                            rosterMember.bkDown = { days: 0, hours: 0};
                        }

                        if ($scope.members[idx].aqDays > 0 || $scope.members[idx].aqHours > 0) {
                            rosterMember.aqDown = { days: $scope.members[idx].aqDays, hours: $scope.members[idx].aqHours};
                        }
                        else {
                            rosterMember.aqDown = { days: 0, hours: 0};
                        }
                        break;
                    }
                }
            }
            else if ($scope.war.team[teamIdx].i.length > 0) {
                // placeholder member
                rosterMember = {
                    u: $scope.war.team[teamIdx].u,
                    ign: $scope.war.team[teamIdx].i,
                    b: teamIdx + 1,
                    th: $scope.war.team[teamIdx].t,
                    w: 100,
                    bk: 0,
                    aq: 0,
                    editable: false
                };
                found = true;
            }

            if (found) {
                $scope.roster.push(rosterMember);
            }
            else {
                // in this case the person on the team is no longer in the clan and shouldn't be on the roster
                // this happens when someone brings the previous war roster forward and someone has left
                //
                // NOTE: This has been patched and must be removed once the bad wars get cleared
                //
                // FURTHER NOTE: the war must be saved at some point after this in order for the change to stick
                $scope.roster.push({});
                $scope.war.team[teamIdx] =
                    {
                        b: teamIdx+1,
                        t: 1,
                        u: null,
                        i: ''
                    };
            }
        }

        for (var baseNum=0; baseNum<$scope.war.bases.length; baseNum++) {
            var hUpgrade = {};
            if ($scope.war.bases[baseNum].a.length > 0) {
                for (var idx=0; idx<$scope.members.length; idx++) {
                    if ($scope.members[idx]._id == $scope.war.bases[baseNum].a[0].u) {
                        // set hero upgrade status on base
                        if ($scope.members[idx].bkDays > 0 || $scope.members[idx].bkHours > 0) {
                            hUpgrade.bkDown = { days: $scope.members[idx].bkDays, hours: $scope.members[idx].bkHours};
                        }
                        else {
                            hUpgrade.bkDown = { days: 0, hours: 0};
                        }

                        if ($scope.members[idx].aqDays > 0 || $scope.members[idx].aqHours > 0) {
                            hUpgrade.aqDown = { days: $scope.members[idx].aqDays, hours: $scope.members[idx].aqHours};
                        }
                        else {
                            hUpgrade.aqDown = { days: 0, hours: 0};
                        }
                        break;
                    }

                }
            }
            $scope.heroesUpgrading.push(hUpgrade);
        }

        // set up display members
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

        angular.forEach($scope.members, function (member) {
            var used = false;
            for (var idx=0; idx<$scope.war.team.length; idx++) {
                if (member._id == $scope.war.team[idx].u) {
                    used = true;
                    break;
                }
            }

            if (!used) {
                var heroes = member.profile.heroes.bk + member.profile.heroes.aq;
                member.displayName = member.profile.warWeight + ' | TH ' + member.profile.buildings.th + ' | Heroes ' + member.profile.heroes.bk + '/' + member.profile.heroes.aq + ' | ' + member.ign;
                $scope.displayMembers.push(member);
            }
        });
        $scope.displayMembers.push(placeHolder);
    }

    function saveWarInternal(callback) {
        // re-set base numbers because players have probably moved around
        for (var idx=0; idx<$scope.war.team.length; idx++) {
            $scope.war.team[idx].b = idx+1;
        }

        warService.save($scope.war, function (err, war) {
            if (err) {
                err.stack_trace.unshift( { file: 'startwar-controller.js', func: 'saveWarInternal', message: 'Error saving war' } );
                errorService.save(err, function() {});
            }
            else if (war == null) {
                // happens when they try to save a new war when an existing war is still active
                $location.path('/home').replace();
            }
            else {
                $scope.war = war;
                if ($scope.newWar) {
                    $location.url('/startwar/' + war._id).replace();
                }
                else {
                    $scope.warSettingsForm.$setPristine();
                    var now = new Date();
                    var warStart = new Date($scope.war.start);
                    $scope.warStarted = false;
                    if (now.getTime() > warStart.getTime()) {
                        $scope.warStarted = true;
                    }
                    updateInterface();
                }
            }

            callback();
        });
    }

}]);
