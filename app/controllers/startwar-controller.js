'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('StartWarCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$window', '$modal', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'warService', 'utils',
function ($rootScope, $scope, $routeParams, $location, $window, $modal, authService, sessionService, errorService, messagelogService, clanService, warService, utils) {
    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    var warId = $routeParams.id;

    $scope.newWar = true;
    $scope.warStarted = false;
    $scope.cascade = true;

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'startwar-controller.js', func: 'init', message: 'Error getting user meta' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.meta = meta;

            clanService.getMembers($scope.meta.current_clan.clan_id, 'all', function (err, members) {
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

                $scope.members.push(
                    {
                        id: null,
                        ign: '<< Placeholder >>'
                    }
                );

                if (err) {
                    err.stack_trace.unshift( { file: 'startwar-controller.js', func: 'init', message: 'Error getting clan members' } );
                    errorService.save(err, function() {});
                }
                else {
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
                                $scope.$broadcast('timer-start');
                                $rootScope.title = 'Clan war vs: ' + war.opponent_name + ' - clash.tools';

                                if (now.getTime() > start.getTime()) {
                                    $scope.warStarted = true;
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
                        $scope.war = {
                            clan_id: $scope.meta.current_clan.clan_id,
                            active: true,
                            visible: false, // not used currently
                            opponent_name: '',
                            opponent_tag: '',
                            player_count: 30,
                            start: new Date(),
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

        $scope.modalOptions = {
            yesBtn: 'Set',
            noBtn: 'Cancel',
            cssClass: cssClass,
            formData: {},
            onYes: function(formData) {
                var now = new Date();
                $scope.war.start = new Date(now.getTime() + ((formData.startsHours*60 + formData.startsMinutes)*60000));
                $scope.warStartTime = $scope.war.start.getTime();
                $scope.$broadcast('timer-start');

                // need to re-set any assignment expirations
                angular.forEach($scope.war.bases, function (base) {
                    angular.forEach(base.a, function (assignment) {
                        assignment.e = new Date($scope.war.start.getTime() + ($scope.clan.war_config.first_attack_time * 60 * 60 * 1000));
                    });
                });

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

    $scope.assignBase = function(baseNum, userId) {
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
        saveWarInternal();
    }

    $scope.assignRoster = function(baseNum, userId) {
        if (userId) {
            for (var idx=0; idx<$scope.members.length; idx++) {
                if ($scope.members[idx]._id == userId) {
                    $scope.war.team[baseNum].u = $scope.members[idx]._id;
                    $scope.war.team[baseNum].i = $scope.members[idx].ign;
                    $scope.war.team[baseNum].t = $scope.members[idx].profile.buildings.th > 1 ? $scope.members[idx].profile.buildings.th :
                        $scope.war.team[baseNum].t > 1 ? $scope.war.team[baseNum].t : 1;


                }
            }
            saveWarInternal();
        }
        else {
            // placeholder team member
            var cssClass = 'center';
            if ($window.innerWidth < 500) {
                cssClass = 'mobile';
            }

            $scope.modalOptions = {
                yesBtn: 'Set',
                noBtn: 'Cancel',
                cssClass: cssClass,
                formData: {},
                onYes: function(formData) {
                    $scope.war.team[baseNum].u = utils.createGUID();
                    $scope.war.team[baseNum].i = formData.ign;
                    $scope.war.team[baseNum].t = 1;

                    // also need to add to members for the dropdowns to function
                    $scope.members.push(
                        {
                            _id: $scope.war.team[baseNum].u,
                            ign: $scope.war.team[baseNum].i,
                            profile: {
                                buildings: {
                                    th: 1
                                }
                            }
                        }
                    );
                    saveWarInternal();
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
        // check for duplicates
/*        var sorted = $scope.war.team.sort(function (a, b) {
            if (a.user_id < b.user_id) {
                return -1;
            }
            else if (a.user_id > b.user_id) {
                return 1;
            }
            else {
                return 0;
            }
        });

        $scope.rosterError = [];
        for (var idx=0; idx<sorted.length-1; idx++) {
            if (sorted[idx].user_id && (sorted[idx].user_id == sorted[idx+1].user_id)) {

            }
        }*/


    }

    $scope.deleteAssignment = function(baseNum) {
        $scope.war.bases[baseNum].a = [];
        saveWarInternal();
    }

    $scope.saveWar = function() {
        saveWarInternal();
    }

    $scope.oppTH = function(baseNum) {
        if ($scope.cascade) {
            // cascade changes to TH level down
            for (var idx=baseNum; idx<$scope.war.bases.length; idx++) {
                $scope.war.bases[idx].t = $scope.war.bases[baseNum-1].t;
            }
        }
        saveWarInternal();
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
        $scope.teamHeroesUpgrading = [];
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

        for (var idx=0; idx<$scope.war.team.length; idx++) {
            var thUpgrade = {};
            for (var memberIdx=0; memberIdx<$scope.members.length; memberIdx++) {
                if ($scope.members[memberIdx]._id == $scope.war.team[idx].u) {
                    // set hero upgrade status on base
                    if ($scope.members[memberIdx].bkDays > 0 || $scope.members[memberIdx].bkHours > 0) {
                        thUpgrade.bkDown = { days: $scope.members[memberIdx].bkDays, hours: $scope.members[memberIdx].bkHours};
                    }
                    else {
                        thUpgrade.bkDown = { days: 0, hours: 0};
                    }

                    if ($scope.members[memberIdx].aqDays > 0 || $scope.members[memberIdx].aqHours > 0) {
                        thUpgrade.aqDown = { days: $scope.members[memberIdx].aqDays, hours: $scope.members[memberIdx].aqHours};
                    }
                    else {
                        thUpgrade.aqDown = { days: 0, hours: 0};
                    }
                    break;
                }
            }
            $scope.teamHeroesUpgrading.push(thUpgrade);
        }
    }

    function saveWarInternal() {
        warService.save($scope.war, function (err, war) {
            if (err) {
                err.stack_trace.unshift( { file: 'startwar-controller.js', func: 'saveWarInternal', message: 'Error saving war' } );
                errorService.save(err, function() {});
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
        });
    }

}]);
