'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('Clashtools.controllers')
.controller('DefaultCtrl', ['$rootScope', '$scope', '$location', 'authService', 'analyticsService', 'errorService',
function ($rootScope, $scope, $location, authService, analyticsService, errorService) {
    // initialize
    $rootScope.title = 'Welcome to clash.tools';

    $scope.loggedIn = false;
    if (authService.isLoggedIn()) {
        $scope.loggedIn = true;
        $location.url('/home').replace();
    }
    else {
        $scope.picIndex = 0;
        $scope.pics = [
            {
                image: 'home-large.png',
                title: 'Home screen',
                description: 'The default home screen for members shows called targets and open bases making it easy to update attacks and sign up for the next open base.'
            },
            {
                image: 'home-findclan.png',
                title: 'Clan search',
                description: 'Clan search lets users find you and request membership - just like it works in the game.'
            },
            {
                image: 'home-confirm.png',
                title: 'Confirm members',
                description: 'When someone wants to join the clan a message is sent to leadership with the request. Any co-leader can confirm or decline. There are no clan passwords to manage.'
            },
            {
                image: 'home-clanactivity.png',
                title: 'Clan activity',
                description: 'Everyone in the clan can follow what\'s happening - players joining, bases being called, attacks logged - a streaming view of the war as it happens.'
            },
            {
                image: 'home-warsettings.png',
                title: 'War settings',
                description: 'Whether your clan assigns attacks or plays free-for-all the war settings page lets you manage your way.'
            },
            {
                image: 'home-bases.png',
                title: 'Enemy bases',
                description: 'View the war by enemy bases or ordered by your team. Get a full picture of what\'s going on during and after the war.'
            },
            {
                image: 'home-topattackers.png',
                title: 'Top attackers',
                description: 'The top attackers during and after the war - updated in real time as attacks are logged. Find out who your true MVP\'s are.'
            },
            {
                image: 'home-roster.png',
                title: 'Leader roster',
                description: 'Leaders have access to the clan roster - both current and past members. Track 3-star rate and average attack value to stay informed.'
            },
            {
                image: 'home-profileheroes.png',
                title: 'Track hero status',
                description: 'When clan members upgrade their heroes they can set a timer in their profile. This way the system can track when heroes are down and inform leaders who are planning the next war.'
            },
            {
                image: 'home-heroesdown.png',
                title: 'War setup',
                description: 'If a member has a hero down the information is available for leaders when they are setting up the next war. This allows leader to adjust matchups accordingly.'
            },
            {
                image: 'home-warhistory.png',
                title: 'And more...',
                description: 'Get your clan using clash.tools today and start enjoying a full war history log, built-in direct messaging to clan mates, and future features like chat, clan linking, and public clan/member profiles.'
            }
        ];

        analyticsService.summaryMetrics(function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'default-controller.js', func: 'init', message: 'Error getting summary metrics' } );
                errorService.save(err, function() {});
            }
            else {
                $scope.metrics = result;
                console.log(result);
            }
        });
    }
}]);