'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('HomeCtrl', ['$rootScope', '$scope', '$interval', 'moment', 'authService', 'cacheService', 'sessionService', 'errorService', 'messagelogService', 'warService', 'clanService',
function ($rootScope, $scope, $interval, moment, authService, cacheService, sessionService, errorService, messagelogService, warService, clanService) {
    // initialize
    $rootScope.title = 'Dashboard - clash.tools';

    $scope.nullState = true;

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.meta = meta;

        if ($scope.meta.current_clan.clan_id) {
            $scope.nullState = false;
            
            // load clan messages initially, and every 60 seconds after that
            loadClanMessages();
            var promise = $interval(loadClanMessages, 60000);
            $scope.$on('$destroy', function() {
                $interval.cancel(promise);
            });

            clanService.getById($scope.meta.current_clan.clan_id, function (err, clan) {
                if (err) {
                    err.stack_trace.unshift( { file: 'startwar-controller.js', func: 'init', message: 'Error getting clan' } );
                    errorService.save(err, function() {});
                }
                else {
                    $scope.clan = clan;

                    // load war once, then every 60 seconds to keep open targets up to date
                    loadWar();
                    var promiseWar = $interval(loadWar, 60000);
                    $scope.$on('$destroy', function() {
                        $interval.cancel(promiseWar);
                    });                                        
                }
            });


        }
    });

    $scope.changeStars = function(targetNum, baseNum, numStars) {
        $scope.playerTargets[targetNum].stars = numStars;
        angular.forEach($scope.war.bases[baseNum].a, function (assignment) {
            if (assignment.u == authService.user.id) {
                assignment.s = numStars;
            }
            else {
                // TODO: something if someone else was also signed up?
            }
        });

        warService.save($scope.war, function (err, war) {
            if (err) {
                err.stack_trace.unshift( { file: 'home-controller.js', func: '$scope.changeStars', message: 'Error setting stars' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.war = war;
            }
        });

        // Log this activity
        var starsText = 'stars';
        if (numStars == 1) {
            starsText = 'star';
        }

        messagelogService.save($scope.meta.current_clan.clan_id, '[ign] attacked base ' + baseNum + ' for ' + numStars + ' ' + starsText, $scope.meta.ign, 'attack', function (err, msg) {
            if (err) {
                err.stack_trace.unshift( { file: 'home-controller.js', func: '$scope.changeStars', message: 'Error saving attack message in the log' } );
                errorService.save(err, function() {});
            }
            else {
                loadClanMessages();
            }
        });
    }

    function loadClanMessages() {
        messagelogService.get($scope.meta.current_clan.clan_id, 10, function (err, messages) {
            if (err) {
                err.stack_trace.unshift( { file: 'home-controller.js', func: 'init', message: 'Error getting message log' } );
                errorService.save(err, function() {});
            }
            else {
                angular.forEach(messages, function (message) {
                    message.created_at = new moment(message.created_at);
                    message.message = message.message.replace('[ign]', '<b class="emphasis">' + message.ign + '</b>');
                });
                $scope.clanMessages = messages;
            }
        });        
    }

    function loadWar() {
        warService.getActive($scope.meta.current_clan.clan_id, function (err, war) {
            if (err) {
                err.stack_trace.unshift( { file: 'home-controller.js', func: 'init', message: 'Error getting current war' } );
                errorService.save(err, function() {});
            }
            else {
                if (war) {
                    $scope.war = war;
                    var now = new Date();
                    var start = new Date(war.start);
                    if (start <= now.getTime()) {
                        // war has started, set the end time to +24 hours from start
                        $scope.warStartTime = start.getTime() + 24*60*60*1000;
                        $scope.warStarted = true;
                    }   
                    else {
                        $scope.warStartTime = start.getTime(); 
                        $scope.warStarted = false;
                    }
                
                    $scope.$broadcast('timer-start'); 

                    $scope.playerTargets = [];
                    angular.forEach(war.bases, function (base) {
                        angular.forEach(base.a, function (assignment) {
                            if (assignment.u == authService.user.id) {
                                var expireTime = new Date(assignment.e);
                                $scope.playerTargets.push(
                                    {
                                        base_num: base.b,
                                        stars: assignment.s,
                                        expires: expireTime.getTime(),
                                        hours: 0,
                                        minutes: 0
                                    }
                                );
                            }
                        })
                    });

                    // set countdown for targets, and set it to refresh every 30 seconds 
                    if ($scope.playerTargets.length > 0) {
                        setCountdownTimers();
                        var promise = $interval(setCountdownTimers, 30000);
                        $scope.$on('$destroy', function() {
                            $interval.cancel(promise);
                        });
                    }
                    findOpenTargets();                      
                }
            }
        });
    }

    function setCountdownTimers() {
        var now = new Date();
        angular.forEach($scope.playerTargets, function (target) {
            var minutesLeft = parseInt((target.expires - now.getTime())/1000/60);
            target.hours = parseInt(minutesLeft / 60);
            target.minutes = parseInt(minutesLeft % 60);
        });
    }

    /*
    *   Using a combination of clan settings and current assignments, determine which bases are open
    */
    function findOpenTargets() {
        $scope.openBases = [];
        angular.forEach($scope.war.bases, function (base) {
            var open = false;
            // clan allows first assignments to be open
            if ($scope.clan.war_config.first_assignment == 'all') {
                if (base.a.length == 0) {
                    // no assignments yet
                    open = true;
                }
            }

            // clan allows cleanups to be open
            if ($scope.clan.war_config.cleanup_assignment == 'all') {
                if (base.a.length > 0
                    && base.a[base.a.length-1].s != null
                    && base.a[base.a.length-1].s != 3)  {
                    // there has been at least one attack, and the latest attack has been done
                    // without getting 3 stars
                    open = true;
                }

                else if (base.a.length > 0) {
                    // check for expired assignments
                    var now = new Date();
                    var expireDate = new Date(base.a[base.a.length-1]);
                    var minutesLeft = parseInt((expireDate - now.getTime())/1000/60);
                    if (minutesLeft <= 0) {
                        // call is expired
                        open = true;
                    }
                }
            }

            if (open) {
                // make sure the user hasn't already attacked the target, and figure out max stars so far
                var alreadyAttacked = false;
                var maxStars = 0;
                angular.forEach(base.a, function (assignment) {
                    if (assignment.user_id == authService.user.id) {
                        alreadyAttacked = true;
                    }

                    if (assignment.s > maxStars) {
                        maxStars = assignment.s;
                    }
                });

                if (!alreadyAttacked) {
                    $scope.openBases.push( 
                        {
                            th: base.t,
                            base_num: base.b,
                            stars: maxStars
                        }
                    );
                }
            }
        });
    }

}]);