'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('ClansCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$window', '$modal', 'authService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'userService', 'emailMessageService', 'CLAN_EMAILS',
function ($rootScope, $scope, $routeParams, $location, $window, $modal, authService, sessionService, errorService, messagelogService, clanService, userService, emailMessageService, CLAN_EMAILS) {

    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';
    $rootScope.title = 'Find a clan - clash.tools';

    $scope.query = $routeParams.query;

    // don't display the asterix for the 'all' search
    if ($scope.query !== '*') {
        $scope.searchTerms = $scope.query;
    }

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        $scope.ign = meta.ign;
        $scope.clan = meta.current_clan;
    });

    runSearch($scope.query);

    $scope.searchLocal = function() {
        if ($scope.localSearchTerms.length > 0) {
            //$scope.query = $scope.localSearchTerms;
            runSearch($scope.localSearchTerms);

        }
        else {
            //$scope.query = '*';
            runSearch('*');
        }
    }

    $scope.joinClan = function (clan) {
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }

        $scope.modalOptions = {
            title: 'Join ' + clan.name + '?',
            message: 'Please confirm you want to join "' + clan.name + '". The leaders of the clan will be contacted for approval and you will be notified in your inbox when you have either been approved or declined.',
            yesBtn: 'Join',
            noBtn: 'Cancel',
            cssClass: cssClass,
            onYes: function() {

                var emailMsg = {
                    subject: $scope.ign + ' would like to join the clan',
                    message: CLAN_EMAILS.joinRequest.replace(/\[1\]/g, $scope.ign).replace(/\[2\]/g, authService.user.id),
                    from_user: {
                        user_id: null, // in this case we really don't want the user getting this in their sent box
                        ign: $scope.ign,
                        deleted: false
                    },
                    to_users: []
                };

                var metaData = {
                    clanId: clan._id,
                    email: emailMsg
                };

                userService.joinClan(authService.user.id, metaData, function (err, result) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'clan-controller.js', func: '$scope.joinClan', message: 'Error with join clan request' } );
                        errorService.save(err, function() {});
                    }
                    else {
                        // TODO: notify UI
                    }
                });
                $location.url('/mail').replace();
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

    function runSearch(query) {
        clanService.allClans(query, 50, function (err, clans) {
            $scope.clans = clans;
        });
    }
}]);
