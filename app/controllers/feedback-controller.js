'use strict';

/*
*   Controller for the home page of the application
*/

angular.module('SiftrockApp.controllers')
.controller('FeedbackCtrl', ['$rootScope', '$scope', '$routeParams', '$window', 'authService', 'feedbackService',
function ($rootScope, $scope, $routeParams, $window, authService, feedbackService) {

    $rootScope.title = 'Siftrock - Feedback and feature requests';

    $scope.feedbackType = "general";
    $scope.submitted = false;

    $scope.ref = $routeParams['p'];

    $scope.agent = $window.navigator.userAgent;

    $scope.submit = function() {
        var labels = ["user request"];

        switch($scope.feedbackType) {
            case 'general': labels.push("feedback"); break;
            case 'feature': labels.push("feature"); break;
            case 'bug': labels.push("bug"); break;
        }

        var ghIssue = {
            "title"   : $scope.feedbackSubject,
            "body"    : 'Submitted by: ' + authService.user.email + '\n' +
                        'Referring path: ' + $scope.ref + '\n' +
                        'User agent: ' + $scope.agent + '\n\n' + 
                        $scope.feedbackDetail,
            "labels"  : labels
        };

        feedbackService.submit(ghIssue, function (err) {
            if (err) {
                err.stack_trace.unshift( { file: 'feedback-controller.js', func: '$scope.submit', message: 'Error submitting issue' } );
                errorService.save(err, function() {});
            }
            $scope.submitted = true;
        });
    }
}]);
