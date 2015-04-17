'use strict';

/*
*   Controller for the admin page
*/

angular.module('SiftrockApp.controllers')
.controller('StreamDetailCtrl', ['$rootScope', '$scope', '$sce', '$routeParams', '$location', 'authService', 'sessionService', 'errorService', 'emailStreamService', 'RESPONSE_TYPES',
function ($rootScope, $scope, $sce, $routeParams, $location, authService, sessionService, errorService, emailStreamService, RESPONSE_TYPES) {

    $rootScope.title = 'Siftrock - Email detail';
    $scope.helpLink = 'http://www.siftrock.com/help/reply-detail/';

    $scope.adminShow = false;

    $scope.types = RESPONSE_TYPES;

    var email_match_type_desc = {
        full_name: 'An email address was found that contains this contact\'s first and last name',
        last_name: 'An email address was found that contains this contact\'s last name',
        first_name: 'An email address was found that contains this contact\'s first name',
        nearest: 'An email address near this contact\s name was found',
        single_name: 'An email address was found that contains this contact\'s name',
        single_name_nearest: 'An email address near this contact\s name was found',
        none: 'No email address was found for this contact',
        email_only: 'An email address was found for this contact'
    };

    var name_match_type_desc = {
        full: 'Contact\'s first and last name were included in the original message',
        single: 'A single name was found for this contact that could represent a first name, last name, or both',
        none: 'No name could be found for this contact in the original message',
        from_email_full: 'Contact\'s name was guessed from an email address that appears to include first and last name',
        from_email_partial: 'Contact\'s name was guessed using an email address',
    };

    var email_id = $routeParams.id;

    sessionService.getCurrentAccount(authService.user.id, function (err, account) {
        if (err) {
            err.stack_trace.unshift( { file: 'streamdetail-controller.js', func: 'init', message: 'Error getting current account' } );
            errorService.save(err, function() {});
        }
        else {
            emailStreamService.getEmailDetail(account._id, email_id, function (err, detail) {
                angular.forEach(detail.people, function (val, key) {
                    val.email_match_description = email_match_type_desc[val.email_match_type];
                    val.name_match_description = name_match_type_desc[val.name_match_type];
                    val.total_confidence = val.email_confidence + val.name_confidence;
                    val.phone_number = val.phone_number.length > 0 ? val.phone_number : 'n/a';
                });


                $scope.detail = detail;
                $scope.detail.raw.htmlTrusted = $sce.trustAsHtml(cleanHtml(detail.raw)); // necessary to allow strange html formatted email crap
            });
        }
    });

    $scope.hide = function() {
        // set hidden and refresh the page
        emailStreamService.setHidden($scope.detail.account_id, $scope.detail._id, function (err, result) {
            if (err) {
                err.stack_trace.unshift( { file: 'streamdetail-controller.js', func: '$scope.hide', message: 'Error hiding email' } );
                errorService.save(err, function() {});
            }
            else {
                $rootScope.globalMessage = "Email hidden";
                $location.path('/stream').replace();
            }
        });
    }

    $scope.adminShowRecords = function() {
        $scope.adminShow = true;
        $scope.adminRaw = JSON.parse(JSON.stringify($scope.detail.raw));
        $scope.adminDetail = JSON.parse(JSON.stringify($scope.detail));
        delete $scope.adminDetail.raw;
    }

    /*
    * Internal function to clean up html for display purposes
    */
    function cleanHtml(inboundEmail) {
        var markup = '';
        if (!inboundEmail.html) {
            // if no html, use the text
            // replace line feeds with breaks for html output
            markup = inboundEmail.text.replace(/\n/g, '<br>');
        }
        else {
            markup = inboundEmail.html;
        }

        // if an entire document is included, get only what's inside the body tag
        var bodyOpen = markup.indexOf('>', markup.indexOf('<body')) + 1;
        var bodyClose = markup.indexOf('</body');
        if (bodyOpen >= 0 && bodyClose >= 0) {
            markup = markup.substring(bodyOpen, bodyClose);
        }
        return markup;
    }

}]);
