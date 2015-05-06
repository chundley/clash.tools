'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('HomeCtrl', ['$rootScope', '$scope', '$interval', 'moment', 'authService', 'cacheService', 'sessionService', 'errorService', 'messagelogService', 'warService',
function ($rootScope, $scope, $interval, moment, authService, cacheService, sessionService, errorService, messagelogService, warService) {
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
                            $scope.started = 'Ends';
                        }   
                        else {
                            $scope.warStartTime = start.getTime(); 
                            $scope.started = 'Starts';
                        }
                    
                        $scope.$broadcast('timer-start'); 

                        $scope.playerTargets = [];
                        angular.forEach(war.bases, function (base) {
                            angular.forEach(base.assignments, function (assignment) {
                                if (assignment.user_id == authService.user.id) {
                                    var expireTime = new Date(assignment.expires);
                                    $scope.playerTargets.push(
                                        {
                                            base_num: base.base_num,
                                            stars: assignment.stars,
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
                    }
                }
            });
        }
    });

    $scope.changeStars = function(targetNum, baseNum, numStars) {
        $scope.playerTargets[targetNum].stars = numStars;

        angular.forEach($scope.war.bases[baseNum].assignments, function (assignment) {
            if (assignment.user_id == authService.user.id) {
                assignment.stars = numStars;
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

    function setCountdownTimers() {
        var now = new Date();
        angular.forEach($scope.playerTargets, function (target) {
            var minutesLeft = parseInt((target.expires - now.getTime())/1000/60);
            target.hours = parseInt(minutesLeft / 60);
            target.minutes = parseInt(minutesLeft % 60);
        });
    }

}]);