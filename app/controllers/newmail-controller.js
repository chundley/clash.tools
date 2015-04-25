'use strict';

/*
*   Controller for clan page
*/

angular.module('Clashtools.controllers')
.controller('NewMailCtrl', ['$rootScope', '$scope', '$routeParams', '$location', 'moment', 'authService', 'sessionService', 'errorService', 'emailMessageService', 'clanService',
function ($rootScope, $scope, $routeParams, $location, moment, authService, sessionService, errorService, emailMessageService, clanService) {
    //$scope.helpLink = 'http://www.siftrock.com/help/dashboard/';

    $scope.emailId = $routeParams.id;
    $scope.folder = $location.search().folder ? $location.search().folder : 'inbox';
    $scope.type = $location.search().hint ? $location.search().hint : 'new';

    $scope.counts = {
        inbox: 0,
        sent: 0,
        trash: 0
    };

    $scope.recipients = [

    ];

    sessionService.getUserMeta(authService.user.id, function (err, meta) {
        if (err) {
            err.stack_trace.unshift( { file: 'mail-maildetail.js', func: 'init', message: 'Error getting user meta data' } );
            errorService.save(err, function() {});
        }
        else {        
            $scope.ign = meta.ign;
            $scope.clan = meta.current_clan;

            if ($scope.type != 'reply') {
                clanService.getMembers($scope.clan.clan_id, 'all', function (err, members) {
                    if (err) {
                        err.stack_trace.unshift( { file: 'mail-maildetail.js', func: 'init', message: 'Error getting user meta data' } );
                        errorService.save(err, function() {});
                    }
                    else {                   
                        $scope.recipientPool = members;
                    }
                });
            }
        }        
    });



    // still need to do this unfortunately for folder counts
    emailMessageService.get(authService.user.id, 20, function (err, mailMessages) {
        if (err) {
            err.stack_trace.unshift( { file: 'mail-maildetail.js', func: 'init', message: 'Error getting email messages' } );
            errorService.save(err, function() {});
        }
        else {
            $scope.allMessages = mailMessages;
            if ($scope.type == 'reply') {
                // need the original sender
                angular.forEach(mailMessages, function (message) {
                    if (message._id == $scope.emailId) {
                        $scope.recipientPool = [
                            { id: message.from_user.user_id, ign: message.from_user.ign }
                        ];
                        $scope.recipients = $scope.recipientPool;
                    }
                });
            }
            setCounts();
        }
    });

    $scope.loadMembers = function(query) {
        return $scope.recipientPool;
    }

    $scope.sendMail = function() {

        console.log($scope.recipients);
    }

    $scope.deleteMessage = function() {
        emailMessageService.delete($scope.emailDetail._id, function (err, resp) {
            if (err) {
                err.stack_trace.unshift( { file: 'maildetail-controller.js', func: '$scope.deleteMessage', message: 'Error deleting message' } );
                errorService.save(err, function() {});
            }
            else {
                $location.path('/mail').search('folder', $scope.folder).replace();
            }
        });
    }

    function setCounts() {
        $scope.counts = {
            inbox: 0,
            sent: 0,
            trash: 0
        };

        angular.forEach($scope.allMessages, function (message) {
            if (message._id == $scope.emailId) {
                $scope.emailDetail = message;
                if ($scope.type == 'reply') {
                    $scope.emailDetail.subject = 'Re: ' + $scope.emailDetail.subject;
                    var m = new moment($scope.emailDetail.created_at);
                    $scope.emailDetail.message = '\n\n-----\nOn ' + m.format('ddd MMMM Do YYYY [at] h:mm:ss A') + ', ' + $scope.emailDetail.from_user.ign + ' wrote:\n' + $scope.emailDetail.message;
                }
                else if ($scope.type == 'forward') {
                    $scope.emailDetail.subject = 'Fwd: ' + $scope.emailDetail.subject;
                    var m = new moment($scope.emailDetail.created_at);
                    $scope.emailDetail.message = '\n\n-----\nOn ' + m.format('ddd MMMM Do YYYY [at] h:mm:ss A') + ', ' + $scope.emailDetail.from_user.ign + ' wrote:\n' + $scope.emailDetail.message;
                }
            }

            if (message.to_user.user_id === authService.user.id) {
                if (message.deleted) {
                    $scope.counts.trash++;
                }
                else {
                    $scope.counts.inbox++;
                }
            }
            if (message.from_user.user_id === authService.user.id) {
                if (message.deleted) {
                    $scope.counts.trash++;
                }
                else {
                    $scope.counts.sent++;
                }
            }
        });
    }

}]);
