

angular.module('SiftrockApp.controllers', []);
angular.module('SiftrockApp.services', []);
angular.module('SiftrockApp.directives', []);

angular.module('SiftrockApp', ['ngRoute', 'ngCookies', 'ngAnimate', 'ngSanitize', 'SiftrockApp.controllers', 'SiftrockApp.services', 'SiftrockApp.directives', 'angular-md5', 'angularMoment', 'webStorageService', 'mgcrea.ngStrap', 'ui.bootstrap.dropdown', 'ui.bootstrap.buttons', 'ui.bootstrap.accordion', 'ui.bootstrap.collapse', 'ui.bootstrap.transition', 'ui.bootstrap.typeahead'])
.config(function ($locationProvider, $routeProvider, $httpProvider) {

    $locationProvider.html5Mode(true);

    var access = roleConfig.accessLevels;

    $routeProvider
        .when('/', { redirectTo: '/home' } )
        .when('/register', { controller: 'RegisterCtrl', templateUrl: '/views/register.html', access: access.public } )
        .when('/login', { controller: 'LoginCtrl', templateUrl: '/views/login.html', access: access.public } )
        .when('/logout', { controller: 'LogoutCtrl', templateUrl: '/views/login.html', access: access.public } )
        .when('/verify/:id', { controller: 'EmailVerifyCtrl', templateUrl: '/views/emailVerify.html', access: access.public } )
        .when('/pwreset/:id', { controller: 'PWResetCtrl', templateUrl: '/views/pwreset.html', access: access.public } )
        .when('/settings', { controller: 'SettingsCtrl', templateUrl: '/views/settings/settings.html', access: access.user } )
        .when('/settings/integration', { controller: 'IntegrationCtrl', templateUrl: '/views/settings/integration.html', access: access.user } )
        .when('/settings/integration/:id', { controller: 'IntegrationCtrl', templateUrl: '/views/settings/integration.html', access: access.user } )
        .when('/feedback', { controller: 'FeedbackCtrl', templateUrl: '/views/feedback.html', access: access.user } )
        .when('/home', { controller: 'HomeCtrl', templateUrl: '/views/home.html', access: access.user } )
        .when('/stream', { controller: 'StreamCtrl', templateUrl: '/views/stream.html', access: access.user } )
        .when('/stream/:id', { controller: 'StreamDetailCtrl', templateUrl: '/views/streamDetail.html', access: access.user } )
        .when('/workflow', { controller: 'WorkflowCtrl', templateUrl: '/views/workflow.html', access: access.user } )
        .when('/workflow/hubspot/:id', { controller: 'HubspotCtrl', templateUrl: '/views/workflowDetail.html', access: access.user } )
        .when('/workflow/marketo/:id', { controller: 'MarketoCtrl', templateUrl: '/views/workflowDetail.html', access: access.user } )
        .when('/messages', { controller: 'MessagesCtrl', templateUrl: '/views/messages.html', access: access.user } )
        .when('/admin', { controller: 'AdminCtrl', templateUrl: '/views/admin/home.html', access: access.sadmin } )
        .when('/admin/unspoof', { controller: 'AdminCtrl', templateUrl: '/views/admin/home.html', access: access.admin } )
        .when('/form/:id', { controller: 'FormCtrl', templateUrl: '/views/form.html', access: access.public } )
        .when('/404', { templateUrl: '/views/404.html' } )
        .otherwise({ redirectTo: '/404'} );

        var interceptor = ['$location', '$q', function($location, $q) {
            function success(response) {
                return response;
            }

            function error(response) {

                if(response.status === 401) {
                    $location.path('/login');
                    return $q.reject(response);
                }
                else {
                    return $q.reject(response);
                }
            }

            return function(promise) {
                return promise.then(success, error);
            }
        }];

        $httpProvider.responseInterceptors.push(interceptor);
})

.run(function ($rootScope, $location, $http, authService, sessionService, cacheService) {
    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        if (!next.access || !authService.authorize(next.access.title)) {
            if(authService.isLoggedIn()) {
                $location.path('/home');
            }
            else {
                $location.path('/login');
            }
        }
    });
})

/*
*   Response types supported by Siftrock
*/
.constant('RESPONSE_TYPES',
    {
        bounce: { type: 'bounce', displayCaps: 'Bounce', displaySmall: 'bounce' },
        changed: { type: 'changed', displayCaps: 'Changed', displaySmall: 'changed' },
        general: { type: 'general', displayCaps: 'General', displaySmall: 'general' },
        human: { type: 'human', displayCaps: 'Human', displaySmall: 'human' },
        left: { type: 'left', displayCaps: 'Left Company', displaySmall: 'left company' },
        spamshield: { type: 'spamshield', displayCaps: 'Spam Shield', displaySmall: 'spam shield' },
        system: { type: 'system', displayCaps: 'System', displaySmall: 'system' },
        unknown: { type: 'unknown', displayCaps: 'Unknown', displaySmall: 'unknown' },
        vacation: { type: 'vacation', displayCaps: 'Vacation', displaySmall: 'vacation' }
    }
)

/*
*   These fields are support in integrations
*/
.constant('SIFTROCK_FIELDS',
    [
        {
            fieldName: 'siftrock.replyType',
            description: 'email reply type',
            filter: false
        },
        {
            fieldName: 'siftrock.originalRecipient',
            description: 'original recipient email address',
            filter: true
        },
        {
            fieldName: 'siftrock.replyText',
            description: 'email reply text',
            filter: true
        },
        {
            fieldName: 'siftrock.sentFrom',
            description: 'email address used to send',
            filter: true
        }
    ]
);