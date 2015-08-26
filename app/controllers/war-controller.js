'use strict';

/*
*   Controller for war bases page
*/

angular.module('Clashtools.controllers')
.controller('WarCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$interval', '$window', '$modal', 'ctSocket', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'warService', 'trackService',
function ($rootScope, $scope, $routeParams, $location, $interval, $window, $modal, ctSocket, authService, sessionService, errorService, messagelogService, clanService, warService, trackService) {

    $scope.warId = $routeParams.id;
    $scope.activeWar = false;

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.meta = meta;

        if ($scope.meta.current_clan.clan_id) {
            clanService.getById($scope.meta.current_clan.clan_id, function (err, clan) {
                if (err) {
                    err.stack_trace.unshift( { file: 'war-controller.js', func: 'init', message: 'Error getting clan' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.clan = clan;

                    // load war initially
                    loadWar(function(){
                        if ($scope.war) {
                            $rootScope.title = 'War vs. ' + $scope.war.opponent_name + ' - clash.tools';
                            // and after that any time a change is broadcast by socket.io
                            ctSocket.on('war:' + $scope.war._id + ':change', function (data) {
                                loadWar(function(){});
                            });
                        }
                    });

                }
            });
        }
    });

    $scope.numBases = function() {
        if ($scope.war) {
            return $scope.war.player_count;
        }
        else {
            return 0;
        }
    }

    $scope.changeStars = function(assignmentIndex, baseNum, userId, ign, numStars) {

        var playerIndex = -1;
        for (var idx=0; idx<$scope.war.team.length; idx++) {
            if ($scope.war.team[idx].u == userId) {
                playerIndex = idx;
            }
        }

        var endDate = new Date($scope.war.start);
        endDate = new Date(endDate.getTime() + 24*60*60*1000);

        var update = {
            aIndex: assignmentIndex,
            bIndex: baseNum - 1,
            pIndex: playerIndex,
            stars: numStars,
            c: $scope.meta.current_clan.clan_id,
            u: userId,
            i: ign,
            cn: $scope.meta.current_clan.name,
            on: $scope.war.opponent_name,
            t: $scope.war.team[playerIndex].t,
            ot: parseInt($scope.war.bases[baseNum-1].t),
            we: endDate
        };

        // update the UI immediately in case this call takes a long time. And even if it fails this prevents
        // people from spamming the app with updates when things are broken
        $scope.war.bases[baseNum-1].a[assignmentIndex].s = numStars;

        warService.updateStars($scope.war._id, update, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'war-controller.js', func: '$scope.changeStars', message: 'Error updating stars' } );
                errorService.save(err, function() {});
            }
            else {
                // Log this activity
                var starsText = 'stars';
                if (numStars == 1) {
                    starsText = 'star';
                }

                var msgText = '[ign] attacked base ' + (baseNum) + ' for ' + numStars + ' ' + starsText;
                if (ign != $scope.meta.ign) {
                    // someone is updating someone else's stars
                    msgText = '[ign] attacked base ' + (baseNum) + ' for ' + numStars + ' ' + starsText + ' (' + $scope.meta.ign + ' updated)';
                }

                messagelogService.save($scope.meta.current_clan.clan_id, msgText, ign, 'attack', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'home-controller.js', func: '$scope.changeStars', message: 'Error saving attack message in the log' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        // nothing to do here
                    }
                });

                $rootScope.globalMessage = 'Attack updated for base #' + baseNum;
                refreshInterface();
            }
        });
    }

    $scope.deleteCall = function(assignmentIndex, baseNum, userId, ign) {
        // delete works differently because removing an item from an array in
        // MongoDb requires a value (in this case, userId)
        var update = {
            u: userId,
            bIndex: baseNum - 1,
            stars: -1
        };

        // update UI regardless of whether the save works to avoid spamming with updates
        $scope.war.bases[baseNum-1].a.splice(assignmentIndex, 1);

        warService.updateStars($scope.war._id, update, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'war-controller.js', func: '$scope.deleteCall', message: 'Error deleting call' } );
                errorService.save(err, function() {});
            }
            else {
                var msgText = '[ign]\'s call on base ' + baseNum + ' removed by ' + $scope.meta.ign;
                if ($scope.meta.ign == ign) {
                    msgText = '[ign] removed call on base ' + baseNum;
                }
                messagelogService.save($scope.meta.current_clan.clan_id, msgText, ign, 'delete', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'home-controller.js', func: '$scope.changeStars', message: 'Error saving attack message in the log' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        // nothing to do here
                    }
                });

                $rootScope.globalMessage = 'Call on base #' + baseNum + ' was removed.'
                refreshInterface();
            }
        });
    }

    $scope.assignBase = function(baseNum) {

        // figure out who doesn't have two assignments already
        var eligibleMembers = [];

        angular.forEach($scope.war.team, function (member) {
            if (member.u && member.u.length > 0) {
                eligibleMembers.push({
                    u: member.u,
                    i: member.i,
                    t: member.t,
                    count: 0
                });
            }
        });

        angular.forEach($scope.war.bases, function (base) {
            angular.forEach(base.a, function (assignment) {
                for (var idx=0; idx<eligibleMembers.length; idx++) {
                    if (eligibleMembers[idx].u == assignment.u) {
                        eligibleMembers[idx].count++
                        if (eligibleMembers[idx].count > 1) {
                            eligibleMembers.splice(idx, 1);
                        }
                        break;
                    }
                }
            });
        });

        eligibleMembers.sort(function (a, b) {
            if (a.t > b.t) {
                return -1
            }
            else if (a.t < b.t) {
                return 1;
            }
            else {
                if (a.i.toLowerCase() < b.i.toLowerCase()) {
                    return -1;
                }
                else {
                    return 1;
                }
            }
        });

        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            yesBtn: 'Assign',
            noBtn: 'Cancel',
            baseNum: baseNum,
            eligibleMembers: eligibleMembers,
            cssClass: cssClass,
            formData: {},
            onYes: function(formData) {
                assignInternal(baseNum, formData.member.u, formData.member.i);
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/assignDialog.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
    }

    function assignInternal(baseNum, userId, ign) {
        // re-load the war to reduce chances of a double assign
        loadWar(function() {
            
            var now = new Date();
            var warStart = new Date($scope.war.start);
            var freeForAllDate = new Date(warStart.getTime() + ((24 - $scope.clan.war_config.free_for_all_time)*60*60*1000));

            // determine if the base is open
            var open = false;
            if ($scope.clan.war_config.overcalls) {
                // if overcalls are allowed we don't care if the base has already been reserved
                open = true;
            }
            else if (now.getTime() >= freeForAllDate.getTime()) {
                // if we are in the free for all period, overcalls are allowed no matter what
                open = true;
            }
            else {
                if ($scope.war.bases[baseNum-1].a.length == 0) {
                    // not called yet
                    open = true;
                }
                else if ($scope.war.bases[baseNum-1].a.length > 0 &&
                         $scope.war.bases[baseNum-1].a[$scope.war.bases[baseNum-1].a.length-1].s != null) {
                    // called, but attacks done
                    open = true;
                }
                else {
                    // need to see if the latest call is expired
                    if ($scope.war.bases[baseNum-1].a.length > 0) {
                        var expireDate = new Date($scope.war.bases[baseNum-1].a[$scope.war.bases[baseNum-1].a.length-1].s);
                        if (now > expireDate) {
                            open = true;
                        }
                    }
                }
            }

            // determine if this person already has two bases before allowing another reservation
            var numReserved = 0;
            angular.forEach($scope.war.bases, function (base) {
                angular.forEach(base.a, function (assignment) {
                    if (assignment.u == userId) {
                        numReserved++;
                    }
                });
            });

            if (open && numReserved < 2) {
                var expireDate = warService.callExpiration($scope.war, $scope.clan.war_config, baseNum);
                var model =
                {
                    bIndex: baseNum -1,
                    assignment: {
                        u: userId,
                        i: ign,
                        c: new Date(),
                        e: expireDate,
                        s: null
                    }
                }

                // update UI so the user gets the feedback, even if the save fails
                $scope.war.bases[baseNum-1].a.push(model.assignment);

                warService.assignBase($scope.war._id, model, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'war-controller.js', func: '$scope.assignBase', message: 'Error assigning base' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        messagelogService.save($scope.meta.current_clan.clan_id, '[ign] was assigned base ' + baseNum + ' by ' + $scope.meta.ign, ign, 'target', function (err, msg) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'home-controller.js', func: '$scope.changeStars', message: 'Error saving attack message in the log' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                // nothing to do here
                            }
                        });

                        $rootScope.globalMessage = 'Base #' + baseNum + ' was assigned to ' + ign;
                        trackService.track('assigned-target', { "view": "bases", "ign": ign} );
                        refreshInterface();
                    }
                });
            }

            else if (numReserved == 2) {
                // notify that this user can't have another assignment, they already have 2
                var cssClass = 'center';
                if ($window.innerWidth < 500) {
                    cssClass = 'mobile';
                }

                $scope.modalOptions = {
                    title: ign + ' already has two bases assigned',
                    message: 'Players can\'t have more than two bases in a war. You need to cancel another reservation for this player before assigning this base.',
                    cssClass: cssClass
                };

                var modalInstance = $modal(
                    {
                        scope: $scope,
                        animation: 'am-fade-and-slide-top',
                        placement: 'center',
                        template: "/views/partials/notifyDialog.html",
                        show: false
                    }
                );

                modalInstance.$promise.then(function() {
                    modalInstance.show();
                });
            }
        });
    }

    $scope.reserveBase = function(baseNum) {
        // first double-check that someone else hasn't reserved the target - load war and verify to reduce
        // the changes that two people sign up for the same target
        loadWar(function() {
            var now = new Date();
            var warStart = new Date($scope.war.start);
            var freeForAllDate = new Date(warStart.getTime() + ((24 - $scope.clan.war_config.free_for_all_time)*60*60*1000));


            // determine if the base is open
            var open = false;
            if ($scope.clan.war_config.overcalls) {
                // if overcalls are allowed we don't care if the base has already been reserved
                open = true;
            }
            else if (now.getTime() >= freeForAllDate.getTime()) {
                // if we are in the free for all period, overcalls are allowed no matter what
                open = true;
            }
            else {
                if ($scope.war.bases[baseNum-1].a.length == 0) {
                    // not called yet
                    open = true;
                }
                else if ($scope.war.bases[baseNum-1].a[$scope.war.bases[baseNum-1].a.length-1].s != null) {
                    // called, but attacks done
                    open = true;
                }
            }

            // determine if this person already has two bases before allowing another reservation
            var numReserved = 0;
            angular.forEach($scope.war.bases, function (base) {
                angular.forEach(base.a, function (assignment) {
                    if (assignment.u == authService.user.id) {
                        numReserved++;
                    }
                });
            });

            if (open && numReserved < 2) {
                var cssClass = 'center';
                if ($window.innerWidth < 500) {
                    cssClass = 'mobile';
                }

                $scope.modalOptions = {
                    title: 'Confirm reservation',
                    message: 'Please confirm you want to reserve base ' + (baseNum),
                    yesBtn: 'Reserve',
                    noBtn: 'Cancel',
                    cssClass: cssClass,
                    onYes: function(formData) {
                        var expireDate = warService.callExpiration($scope.war, $scope.clan.war_config, baseNum);
                        var model =
                        {
                            bIndex: baseNum -1,
                            assignment: {
                                u: authService.user.id,
                                i: $scope.meta.ign,
                                c: new Date(),
                                e: expireDate,
                                s: null,
                            }
                        }

                        // update UI so the user gets the feedback, even if the save fails
                        $scope.war.bases[baseNum-1].a.push(model.assignment);

                        warService.assignBase($scope.war._id, model, function (err, war) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'war-controller.js', func: '$scope.reserveBase', message: 'Error reserving base' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                messagelogService.save($scope.meta.current_clan.clan_id, '[ign] called base ' + (baseNum), $scope.meta.ign, 'target', function (err, msg) {
                                    if (err) {
                                        err.stack_trace.unshift( { file: 'war-controller.js', func: '$scope.reserveBase', message: 'Error saving attack message in the log' } );
                                        errorService.save(err, function() {});
                                    }
                                    else {
                                        // nothing
                                    }
                                });

                                $rootScope.globalMessage = 'You reserved base # ' + baseNum;
                                trackService.track('reserved-target', { "view": "bases"} );
                                refreshInterface();
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
            else if (numReserved == 2) {
                // notify user that they already have two reservations
                var cssClass = 'center';
                if ($window.innerWidth < 500) {
                    cssClass = 'mobile';
                }

                $scope.modalOptions = {
                    title: 'You already have two bases assigned',
                    message: 'You can\'t reserve more than two bases in a war. You need to cancel another reservation before signing up for this base.',
                    cssClass: cssClass
                };

                var modalInstance = $modal(
                    {
                        scope: $scope,
                        animation: 'am-fade-and-slide-top',
                        placement: 'center',
                        template: "/views/partials/notifyDialog.html",
                        show: false
                    }
                );

                modalInstance.$promise.then(function() {
                    modalInstance.show();
                });
            }
            else {
                // notify user that the base is now reserved somehow
                var cssClass = 'center';
                if ($window.innerWidth < 500) {
                    cssClass = 'mobile';
                }

                $scope.modalOptions = {
                    title: 'Base is reserved',
                    message: 'Base ' + (baseNum+1) + ' was just reserved a few seconds ago by ' + $scope.war.bases[baseNum].a[$scope.war.bases[baseNum].a.length-1].i,
                    cssClass: cssClass
                };

                var modalInstance = $modal(
                    {
                        scope: $scope,
                        animation: 'am-fade-and-slide-top',
                        placement: 'center',
                        template: "/views/partials/notifyDialog.html",
                        show: false
                    }
                );

                modalInstance.$promise.then(function() {
                    modalInstance.show();
                });
            }
        });
    }

    $scope.baseNotes = function(baseNum) {
        $location.url('/war/notes/' + $scope.war._id + '/' + baseNum);
    }

    function loadWar(callback) {
        warService.getById($scope.warId, function (err, war) {
            if (err) {
                err.stack_trace.unshift( { file: 'war-controller.js', func: 'loadWar', message: 'Error getting current war' } );
                errorService.save(err, function() {});
                callback();
            }
            else {
                if (war) {
                    $scope.war = war;
                    if (war.active) {
                        $scope.activeWar = true;
                    }
                    refreshInterface();
                    callback();
                }
                else {
                    callback();
                }
            }
        });
    }

    function refreshInterface() {
        var now = new Date();
        var warStart = new Date($scope.war.start);
        var freeForAllDate = new Date(warStart.getTime() + ((24 - $scope.clan.war_config.free_for_all_time)*60*60*1000));
        var warEnd = new Date(warStart.getTime() + (24*60*60*1000));

        var now = new Date();

        if (warStart.getTime() <= now.getTime()) {
            // war has started, set the end time to +24 hours from start
            $scope.warStartTime = warStart.getTime() + 24*60*60*1000;
            $scope.warStarted = true;
        }
        else {
            $scope.warStartTime = warStart.getTime();
            $scope.warStarted = false;
        }

        $scope.warEnded = false;
        if (warEnd.getTime() <= now.getTime()) {
            $scope.warEnded = true;
        }

        $scope.$broadcast('timer-start');

        angular.forEach($scope.war.bases, function (base) {
            var maxStars = null;
            angular.forEach(base.a, function (assignment) {
                var expires = 0;
                if (assignment.e != null) {
                    var expireTime = new Date(assignment.e);
                    expires = expireTime.getTime();
                }
                if (assignment.s != null && assignment.s > maxStars) {
                    maxStars = assignment.s;
                }

                // need this case for zero stars since the above comparison won't pick it up
                if (maxStars == null && assignment.s==0) {
                    maxStars = 0;
                }

                assignment.expires = expires;
            });

            base.maxStars = maxStars;
            base.isOpen = false;

            // determine if the base is open
            if ($scope.clan.war_config.overcalls) {
                // if overcalls are allowed we don't care if the base has already been reserved
                base.isOpen = true;
            }
            else if ($scope.warStarted && base.a.length == 0) {
                // war has started and this base is uncalled
                base.isOpen = true;
            }
            else if ($scope.clan.war_config.first_assignment == 'all'
                     && base.a.length == 0) {
                // first assignment is open to all, so bases should be open if not assigned yet
                base.isOpen = true;
            }
            else if (!$scope.warStarted
                     && base.a.length == 0
                     && ($scope.meta.role == 'coleader' || $scope.meta.role =="leader")) {
                // leaders can assign any time
                base.isOpen = true;
            }
            else if (base.a.length > 0
                     && base.a[base.a.length-1].expires < now.getTime()) {
                // latest has expired
                base.isOpen = true;
            }
            else if (now.getTime() >= freeForAllDate.getTime()) {
                // if we are in the free for all period, overcalls are allowed no matter what
                base.isOpen = true;
            }
            else if (!$scope.clan.war_config.overcalls && base.a.length > 0) {
                // determine if the current call has expired
                if (now.getTime() > base.a[base.a.length-1].e) {
                    base.isOpen = true;
                }
                // determine if the latest attack has been done
                if (base.a[base.a.length-1].s != null) {
                    base.isOpen = true;
                }
            }
        });

        setCountdownTimers();
        var promise = $interval(setCountdownTimers, 30000);
        $scope.$on('$destroy', function() {
            $interval.cancel(promise);
        });
    }

    function setCountdownTimers() {
        var now = new Date();
        var openMembers = {};
        angular.forEach($scope.war.bases, function (base) {
            angular.forEach(base.a, function (assignment) {
                if (assignment.expires > 0) {
                    var minutesLeft = parseInt((assignment.expires - now.getTime())/1000/60);
                    assignment.hours = parseInt(minutesLeft / 60);
                    assignment.minutes = parseInt(minutesLeft % 60);

                    if (minutesLeft < 0) {
                        //expired!
                        assignment.expires = -assignment.expires;
                    }
                }
            });
        });
    }

}]);
