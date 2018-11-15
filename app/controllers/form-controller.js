'use strict';

/*
*   Controller for creating and processing forms from the marketing web site
*/

angular.module('Clashtools.controllers')
.controller('FormCtrl', ['$scope', '$routeParams', '$location', 'errorService', 'mailService',
function ($scope, $routeParams, $location, errorService, mailService) {

    $scope.formType = $routeParams.id;
    $scope.formCssClass = $location.search().class ? 'form_' + $location.search().class : 'form_default';

    console.log($scope.formCssClass);

    $scope.submitted = false;

    // some day move this to database
    $scope.formTypes = {
        question: {
            type: 'Question',
            message: 'Your question has been submitted. Thanks for your interest in Clash.tools, we will be in contact with you shortly.',
            fields: [
                {
                    name: 'name',
                    label: 'Your Name',
                    value: '',
                    type: 'text',
                    required: true
                },
                {
                    name: 'email',
                    label: 'Email',
                    value: '',
                    type: 'email',
                    required: true
                },
                {
                    name: 'company',
                    label: 'Company',
                    value: '',
                    type: 'text',
                    required: true
                },
                {
                    name: 'question',
                    label: 'Question',
                    value: '',
                    type: 'textarea',
                    rows: 4,
                    required: true
                }
            ]
        },
        lp_hubspot: {
            type: 'Hubspot landing page',
            message: 'Thank you for your interest in Clash.tools. We will be in contact with you shortly.',
            fields: [
                {
                    name: 'name',
                    label: 'Your Name',
                    value: '',
                    type: 'text',
                    required: true
                },
                {
                    name: 'email',
                    label: 'Email',
                    value: '',
                    type: 'email',
                    required: true
                },
                {
                    name: 'company',
                    label: 'Company',
                    value: '',
                    type: 'text',
                    required: true
                }
            ]
        }
    };

    $scope.form = $scope.formTypes[$scope.formType];


       // $location.path('/login');

    $scope.processForm = function() {
        mailService.wwwForm($scope.formTypes[$scope.formType], function (err, ret) {
            if (err) {
                $scope.error = true;
            }
            else {
                $scope.success = true;
            }
        });
        $scope.submitted = true;
    }

}]);