'use strict';

/*
*   Controller for war team page
*/

angular.module('Clashtools.controllers')
.controller('WarEndCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$interval', '$window', '$modal', 'ctSocket', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'warService', 'attackResultService', 'trackService',
function ($rootScope, $scope, $routeParams, $location, $interval, $window, $modal, ctSocket, authService, sessionService, errorService, messagelogService, clanService, warService, attackResultService, trackService) {

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


                    // needed for avatars
                    clanService.getMembers($scope.meta.current_clan.clan_id, 'all', function (err, members) {
                        $scope.members = members;

                        // load war initially
                        loadWar(function(){
                            if ($scope.war) {
                                $rootScope.title = 'End war vs. ' + $scope.war.opponent_name + ' - clash.tools';
                                // and after that any time a change is broadcast by socket.io
                                ctSocket.on('war:' + $scope.war._id + ':change', function (data) {
                                    loadWar(function(){});
                                });
                            }
                        });
                    });
                }
            });
        }
    });


    $scope.addAttack = function(member) {
        console.log(member);

        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            yesBtn: 'Save',
            noBtn: 'Cancel',
            cssClass: cssClass,
            formData: {
                ign: member.i,
                team: $scope.war.team   // need an array to create dropdown
            },
            onYes: function(formData) {
                console.log(formData);

                // first, assign the base. Then update the attack
                var model =
                {
                    bIndex: formData.base,
                    assignment: {
                        u: member.u,
                        i: member.i,
                        c: new Date(),
                        e: new Date(),
                        s: null
                    }
                }

                warService.assignBase($scope.war._id, model, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'warend-controller.js', func: '$scope.addAttack', message: 'Error assigning base' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        messagelogService.save($scope.meta.current_clan.clan_id, '[ign] was assigned base ' + (formData.base + 1) + ' by ' + $scope.meta.ign, member.i, 'target', function (err, msg) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'warend-controller.js', func: '$scope.addAttack', message: 'Error saving attack message in the log' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                // nothing to do here
                            }
                        });

                        //$rootScope.globalMessage = 'Base #' + baseNum + ' was assigned to ' + ign;
                        trackService.track('assigned-target', { "view": "endwar", "ign": member.i} );

                        var assignmentIndex = $scope.war.bases[formData.base].a.length; // once saved, this should be the index of the assignment
                        var playerIndex = -1;
                        for (var idx=0; idx<$scope.war.team.length; idx++) {
                            if ($scope.war.team[idx].u == member.u) {
                                playerIndex = idx;
                            }
                        }

                        var endDate = new Date($scope.war.start);
                        endDate = new Date(endDate.getTime() + 24*60*60*1000);

                        var update = {
                            aIndex: assignmentIndex,
                            bIndex: formData.base,
                            pIndex: playerIndex,
                            stars: formData.stars,
                            c: $scope.meta.current_clan.clan_id,
                            u: member.u,
                            i: member.i,
                            cn: $scope.meta.current_clan.name,
                            on: $scope.war.opponent_name,
                            t: $scope.war.team[playerIndex].t,
                            ot: parseInt($scope.war.bases[formData.base].t),
                            we: endDate
                        };                        



                        warService.updateStars($scope.war._id, update, function (err, result) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'endwar-controller.js', func: '$scope.addAttack', message: 'Error updating stars' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                // Log this activity
                                var starsText = 'stars';
                                if (formData.stars == 1) {
                                    starsText = 'star';
                                }

                                messagelogService.save($scope.meta.current_clan.clan_id, '[ign] attacked base ' + (formData.base+1) + ' for ' + formData.stars + ' ' + starsText + ' (' + $scope.meta.ign + ' updated)', member.i, 'attack', function (err, msg) {
                                    if (err) {
                                        err.stack_trace.unshift( { file: 'home-controller.js', func: '$scope.addAttack', message: 'Error saving attack message in the log' } );
                                        errorService.save(err, function() {});
                                    }
                                    else {
                                        // nothing to do here
                                    }
                                });

                                $rootScope.globalMessage = 'Attack updated for base #' + (formData.base+1);
                                loadWar();
                            }
                        });

                    }
                });                
            }
        };

        var modalInstance = $modal(
            {
                scope: $scope,
                animation: 'am-fade-and-slide-top',
                placement: 'center',
                template: "/views/partials/addAttack.html",
                show: false
            }
        );

        modalInstance.$promise.then(function() {
            modalInstance.show();
        });
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





                // paste
                var totStars = 0;
                var totAttacks = 0;
                var missingAttacks = {};
                var invalidAttacks = [];

                var possibleAttacks = $scope.war.bases.length * 2;

                angular.forEach($scope.war.team, function (tm) {
                    if (tm.u != null) {
                        missingAttacks[tm.u] = {
                            i: tm.i,
                            u: tm.u,
                            missing: 2
                        };
                    }
                });

                angular.forEach($scope.war.bases, function (base) {
                    var maxStars = 0;
                    angular.forEach(base.a, function (assignment) {
                        if (assignment.s != null) {
                            totAttacks++;
                            if (!missingAttacks[assignment.u]) {
                                invalidAttacks.push({
                                    b: base.b,
                                    u: assignment.u,
                                    i: assignment.i,
                                    s: assignment.s
                                });
                                console.log(assignment);
                            }

                            else {  
                                missingAttacks[assignment.u].missing--;
                                if (assignment.s > maxStars) {
                                    maxStars = assignment.s;
                                }
                            }
                        }
                    });
                    totStars += maxStars;
                });


                $scope.totalAttacks = totAttacks;
                $scope.possibleAttacks = possibleAttacks;
                $scope.totalStars = totStars;
                $scope.missingAttacks = missingAttacks;
                $scope.invalidAttacks = invalidAttacks;
                // end paste






                }
                else {
                    callback();
                }
            }
        });
    }
}]);
