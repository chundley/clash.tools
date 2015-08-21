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

        // determine if this player has any unlogged attacks which can be used for the dialog
        // if they have two unlogged, just grab the first one and let the user repeat
        var unloggedBase = -1;
        var assignmentIndex = -1;
        for (var idx=0; idx<$scope.war.bases.length; idx++) {
            for (var idx2=0; idx2<$scope.war.bases[idx].a.length; idx2++) {
                if ($scope.war.bases[idx].a[idx2].u == member.u && $scope.war.bases[idx].a[idx2].s==null) {
                    // base is assigned with no stars entered
                    unloggedBase = idx;
                    assignmentIndex = idx2; // use this later for updating existing assignment
                    break;
                }
            }
            if (unloggedBase >= 0) {
                break;
            }
        }

        var baseArray = [];
        for (var bIdx=0; bIdx<$scope.war.team.length; bIdx++) {
            baseArray.push(bIdx + 1);
        }

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
                base: unloggedBase + 1,
                hasBase: true ? unloggedBase >= 0 : false,
                bases: baseArray   // need an array to create dropdown

            },
            onYes: function(formData) {

                formData.base -= 1;

                if (unloggedBase >= 0) {
                    if (unloggedBase != formData.base) {
                        // need to remove existing call, add new call, and update stars
                        removeCall(member.u, member.i, unloggedBase, function (err) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'endwar-controller.js', func: '$scope.addAttack', message: 'Error removing call' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                addCall(member.u, member.i, formData.base, function (err) {
                                    if (err) {
                                        err.stack_trace.unshift( { file: 'endwar-controller.js', func: '$scope.addAttack', message: 'Error adding call' } );
                                        errorService.save(err, function() {});
                                    }
                                    else {
                                        // resset assignment index since we added a new assignment
                                        assignmentIndex = $scope.war.bases[formData.base].a.length;
                                        updateStars(member.u, member.i, formData.base, assignmentIndex, formData.stars, function (err) {
                                            if (err) {
                                                err.stack_trace.unshift( { file: 'endwar-controller.js', func: '$scope.addAttack', message: 'Error updating stars' } );
                                                errorService.save(err, function() {});
                                            }
                                            else {
                                                $rootScope.globalMessage ='Attack was logged for ' + member.i + ' on base ' + (formData.base + 1);
                                                loadWar();
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    else {
                        // updating an existing assignment
                        updateStars(member.u, member.i, formData.base, assignmentIndex, formData.stars, function (err) {
                            if (err) {
                                err.stack_trace.unshift( { file: 'endwar-controller.js', func: '$scope.addAttack', message: 'Error updating stars' } );
                                errorService.save(err, function() {});
                            }
                            else {
                                $rootScope.globalMessage ='Attack was logged for ' + member.i + ' on base ' + (formData.base+1);
                                loadWar();
                            }
                        });
                    }
                }
                else {
                    // if no unlogged base for this member, add the call and update stars
                    addCall(member.u, member.i, formData.base, function (err) {
                        if (err) {
                            var existingAttack = false;
                            angular.forEach(err.stack_trace, function (item) {
                                if (item.message == 'Assignment already exists') {
                                    existingAttack = true;
                                }
                            });
                            if (existingAttack) {
                                $rootScope.globalMessage = member.i + " already has an attack logged for base " + (formData.base + 1);
                            }
                            else {
                                console.log(err);
                                err.stack_trace.unshift( { file: 'endwar-controller.js', func: '$scope.addAttack', message: 'Error adding call' } );
                                errorService.save(err, function() {});
                            }
                        }
                        else {
                            // resset assignment index since we added a new assignment
                            assignmentIndex = $scope.war.bases[formData.base].a.length;
                            updateStars(member.u, member.i, formData.base, assignmentIndex, formData.stars, function (err) {
                                if (err) {
                                    err.stack_trace.unshift( { file: 'endwar-controller.js', func: '$scope.addAttack', message: 'Error updating stars' } );
                                    errorService.save(err, function() {});
                                }
                                else {
                                    $rootScope.globalMessage ='Attack was logged for ' + member.i + ' on base ' + (formData.base+1);
                                    loadWar();
                                }
                            });
                        }
                    });
                }
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

    $scope.removeInvalid = function() {

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

                    var totStars = 0;
                    var totAttacks = 0;
                    var missingAttacksTemp = {};
                    var missingAttacks = [];
                    var invalidAttacks = [];

                    var possibleAttacks = $scope.war.bases.length * 2;

                    angular.forEach($scope.war.team, function (tm) {
                        if (tm.u != null) {
                            missingAttacksTemp[tm.u] = {
                                i: tm.i,
                                u: tm.u,
                                b: tm.b,
                                missing: 2
                            };
                        }
                    });

                    angular.forEach($scope.war.bases, function (base) {
                        var maxStars = 0;
                        angular.forEach(base.a, function (assignment) {
                            if (assignment.s != null) {
                                totAttacks++;
                                if (!missingAttacksTemp[assignment.u]) {
                                    invalidAttacks.push({
                                        b: base.b,
                                        u: assignment.u,
                                        i: assignment.i,
                                        s: assignment.s
                                    });
                                }

                                else {
                                    missingAttacksTemp[assignment.u].missing--;
                                    if (assignment.s > maxStars) {
                                        maxStars = assignment.s;
                                    }
                                }
                            }
                        });
                        totStars += maxStars;
                    });

                    angular.forEach(missingAttacksTemp, function (ma) {
                        if (ma.missing > 0) {
                            missingAttacks.push({
                                i: ma.i,
                                u: ma.u,
                                b: ma.b,
                                missing: ma.missing
                            });
                        }
                    });

                    $scope.totalAttacks = totAttacks;
                    $scope.possibleAttacks = possibleAttacks;
                    $scope.totalStars = totStars;
                    $scope.missingAttacks = missingAttacks;
                    $scope.invalidAttacks = invalidAttacks;
                    callback();

                }
                else {
                    callback();
                }
            }
        });
    }

    /*
    *   Remove a call
    */
    function removeCall(userId, ign, baseIndex, callback) {
        var update = {
            u: userId,
            bIndex: baseIndex,
            stars: -1
        };

        warService.updateStars($scope.war._id, update, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'endwar-controller.js', func: 'removeCall', message: 'Error deleting call' } );
                callback(err);
            }
            else {
                messagelogService.save($scope.meta.current_clan.clan_id, '[ign]\'s call on base ' + (baseIndex+1) + ' removed by ' + $scope.meta.ign, ign, 'delete', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'warend-controller.js', func: 'removeCall', message: 'Error saving attack message in the log' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        // nothing to do here
                    }
                });

                callback(null);
            }
        });
    }

    /*
    *   Add a call
    */
    function addCall(userId, ign, baseIndex, callback) {
        var model =
        {
            bIndex: baseIndex,
            assignment: {
                u: userId,
                i: ign,
                c: new Date(),
                e: new Date(),
                s: null
            }
        }

        warService.assignBase($scope.war._id, model, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'warend-controller.js', func: '$scope.addAttack', message: 'Error assigning base' } );
                callback(err);
            }
            else {
                messagelogService.save($scope.meta.current_clan.clan_id, '[ign] was assigned base ' + (baseIndex + 1) + ' by ' + $scope.meta.ign, ign, 'target', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'warend-controller.js', func: '$scope.addAttack', message: 'Error saving attack message in the log' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        // nothing to do here
                    }
                });

                //$rootScope.globalMessage = 'Base #' + baseNum + ' was assigned to ' + ign;
                trackService.track('assigned-target', { "view": "endwar", "ign":ign} );

                callback(null);
            }
        });
    }

    function updateStars(userId, ign, baseIndex, assignmentIndex,stars, callback) {
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
            bIndex: baseIndex,
            pIndex: playerIndex,
            stars: stars,
            c: $scope.meta.current_clan.clan_id,
            u: userId,
            i: ign,
            cn: $scope.meta.current_clan.name,
            on: $scope.war.opponent_name,
            t: $scope.war.team[playerIndex].t,
            ot: parseInt($scope.war.bases[baseIndex].t),
            we: endDate
        };


        warService.updateStars($scope.war._id, update, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'endwar-controller.js', func: 'updateAttack', message: 'Error updating stars' } );
                callback(err);
            }
            else {
                // Log this activity
                var starsText = 'stars';
                if (stars == 1) {
                    starsText = 'star';
                }

                messagelogService.save($scope.meta.current_clan.clan_id, '[ign] attacked base ' + (baseIndex+1) + ' for ' + stars + ' ' + starsText + ' (' + $scope.meta.ign + ' updated)', ign, 'attack', function (err, msg) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'home-controller.js', func: 'updateAttack', message: 'Error saving attack message in the log' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        // nothing to do here
                    }
                });
                callback(null);
            }
        });

    }

}]);
