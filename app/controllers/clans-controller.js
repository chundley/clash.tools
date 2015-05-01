'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('ClansCtrl', ['$rootScope', '$scope', '$routeParams', '$location', '$window', '$modal', 'authService', 'cacheService', 'sessionService', 'errorService', 'messagelogService', 'clanService', 'emailMessageService', 'CLAN_EMAILS',
function ($rootScope, $scope, $routeParams, $location, $window, $modal, authService, cacheService, sessionService, errorService, messagelogService, clanService, emailMessageService, CLAN_EMAILS) {

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

        // make the dialog better
        var cssClass = 'center';
        if ($window.innerWidth < 500) {
            cssClass = 'mobile';
        }
        console.log($window.innerWidth);
        $scope.modalOptions = {
            title: 'Join ' + clan.name + '?',
            message: 'Please confirm you want to join "' + clan.name + '". The leaders of the clan will be contacted for approval.',
            yesBtn: 'Join',
            noBtn: 'Cancel',
            cssClass: cssClass,
            onYes: function() {
                // need to send app emails to leaders and coleaders
                clanService.getMembers(clan._id, 'coleader,leader', function (err, members) {

                    // Log this activity
                    messagelogService.save(clan._id, '[ign] would like to join the clan', $scope.ign, 'member', function (err, msg) {
                        if (err) {
                            err.stack_trace.unshift( { file: 'clan-controller.js', func: '$scope.saveNewClan', message: 'Error saving new clan message in the log' } );
                            errorService.save(err, function() {});
                        }
                    });

                    var emailMsg = {
                        subject: $scope.ign + ' would like to join the clan',
                        //message: 'There has just been a request to join the clan from ' + $scope.ign,
                        message: CLAN_EMAILS.joinRequest.replace(/\[1\]/g, $scope.ign).replace(/\[2\]/g, authService.user.id),
                        from_user: {
                            user_id: authService.user.id,
                            ign: $scope.ign,
                            deleted: false
                        },
                        to_users: [],
                        created_at: new Date()
                    };

                    angular.forEach(members, function (member) {
                        emailMsg.to_users.push(
                            {
                                user_id: member._id,
                                ign: member.ign,
                                read: false,
                                deleted: false
                            }
                        );
                    });

                    emailMessageService.save(emailMsg, function (err, msg) {
                        if (err) {

                        }
                        else {
                            // do something yeah?
                        }
                    });
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

    function runSearch(query) {
        clanService.allClans(query, function (err, clans) {
            $scope.clans = clans;
        });
    }
}]);
