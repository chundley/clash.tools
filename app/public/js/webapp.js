

angular.module('Clashtools.controllers', []);
angular.module('Clashtools.services', []);
angular.module('Clashtools.directives', []);

angular.module('Clashtools', ['ngRoute', 'ngCookies', 'ngAnimate', 'ngSanitize', 'Clashtools.controllers', 'Clashtools.services', 'Clashtools.directives', 'angular-md5', 'angularMoment', 'webStorageService', 'mgcrea.ngStrap', 'ui.bootstrap.dropdown', 'ui.bootstrap.buttons', 'ui.bootstrap.accordion', 'ui.bootstrap.collapse', 'ui.bootstrap.transition', 'ui.bootstrap.typeahead', 'ui.bootstrap.popover', 'ngTagsInput', 'ngFileUpload', 'timer', 'btford.socket-io'])
.config(function ($locationProvider, $routeProvider, $httpProvider) {

    $locationProvider.html5Mode(true);

    var access = roleConfig.accessLevels;

    $routeProvider
        .when('/', { controller: 'DefaultCtrl', templateUrl: '/views/default.html', access: access.public } )
        .when('/help/:id', { controller: 'HelpCtrl', templateUrl: '/views/help.html', access: access.public } )
        .when('/register', { controller: 'RegisterCtrl', templateUrl: '/views/register.html', access: access.public } )
        .when('/login', { controller: 'LoginCtrl', templateUrl: '/views/login.html', access: access.public } )
        .when('/logout', { controller: 'LogoutCtrl', templateUrl: '/views/login.html', access: access.public } )
        .when('/verify/:id', { controller: 'EmailVerifyCtrl', templateUrl: '/views/emailVerify.html', access: access.public } )
        .when('/pwreset/:id', { controller: 'PWResetCtrl', templateUrl: '/views/pwreset.html', access: access.public } )
        .when('/home', { controller: 'HomeCtrl', templateUrl: '/views/home.html', access: access.member } )
        .when('/profile', { controller: 'ProfileCtrl', templateUrl: '/views/profile.html', access: access.member } )
        .when('/results', { controller: 'ResultsCtrl', templateUrl: '/views/results.html', access: access.member } )
        .when('/results/:id', { controller: 'ResultsCtrl', templateUrl: '/views/results.html', access: access.coleader } )
        .when('/playernotes/:id', { controller: 'PlayerNotesCtrl', templateUrl: '/views/playerNotes.html', access: access.coleader } )
        .when('/mail', { controller: 'MailCtrl', templateUrl: '/views/mail.html', access: access.member } )
        .when('/mail/:id', { controller: 'MailDetailCtrl', templateUrl: '/views/mailDetail.html', access: access.member } )
        .when('/newmail/:id', { controller: 'NewMailCtrl', templateUrl: '/views/newMail.html', access: access.member } )
        .when('/clan/:id', { controller: 'ClanCtrl', templateUrl: '/views/clan.html', access: access.member } )
        .when('/clans/:query', { controller: 'ClansCtrl', templateUrl: '/views/clans.html', access: access.member } )
        .when('/startwar/:id', { controller: 'StartWarCtrl', templateUrl: '/views/startWar.html', access: access.coleader } )
        .when('/war', { controller: 'WarsCtrl', templateUrl: '/views/wars.html', access: access.member } )
        .when('/war/:id', { controller: 'WarCtrl', templateUrl: '/views/war.html', access: access.member } )
        .when('/war/team/:id', { controller: 'WarTeamCtrl', templateUrl: '/views/warTeam.html', access: access.member } )
        .when('/war/summary/:id', { controller: 'WarSummaryCtrl', templateUrl: '/views/warSummary.html', access: access.member } )
        .when('/war/notes/:id/:baseNum', { controller: 'BaseNotesCtrl', templateUrl: '/views/baseNotes.html', access: access.member } )
        .when('/members', { controller: 'MembersCtrl', templateUrl: '/views/members.html', access: access.member } )
        .when('/members/:id', { controller: 'MemberCtrl', templateUrl: '/views/profile.html', access: access.coleader } )
        .when('/roster', { controller: 'RosterCtrl', templateUrl: '/views/roster.html', access: access.coleader } )
        .when('/banlist', { controller: 'BanListCtrl', templateUrl: '/views/banlist.html', access: access.elder } )
        .when('/chat', { controller: 'ChatCtrl', templateUrl: '/views/chat.html', access: access.member } )
        .when('/action/:id', { controller: 'ActionCtrl', templateUrl: '/views/action.html', access: access.member } )
        .when('/admin', { controller: 'AdminHomeCtrl', templateUrl: '/views/admin/admin-home.html', access: access.sadmin } )
        .when('/admin/clan/:id', { controller: 'AdminClanCtrl', templateUrl: '/views/admin/admin-clan.html', access: access.sadmin } )
/*        .when('/messages', { controller: 'MessagesCtrl', templateUrl: '/views/messages.html', access: access.user } )
        .when('/admin', { controller: 'AdminCtrl', templateUrl: '/views/admin/home.html', access: access.sadmin } )
        .when('/admin/unspoof', { controller: 'AdminCtrl', templateUrl: '/views/admin/home.html', access: access.admin } )
        .when('/form/:id', { controller: 'FormCtrl', templateUrl: '/views/form.html', access: access.public } )*/
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

.constant('CLAN_EMAILS',
    {
        joinRequest: 'There has just been a request to join the clan from <b>[1]</b>. Please confirm or decline the request by selecting from below:<br/><br/><a href="/action/confirm?id=[2]" class="btn btn-sm btn-emphasis">Confirm</a> <a href="/action/decline?id=[2]" class="btn btn-sm btn-alternate">Decline</a>',
        joinConfirmed: 'Your request to join the clan <b>[1]</b> has been approved by <b>[2]</b>. Refresh your browser if you don\'t see the clan name under your user name',
        joinDeclined: 'Your request to join the clan <b>[1]</b> has been declined',
        kicked: 'You have been kicked out of the clan by <b>[1]</b>'
    }
);

/*
*   Response types supported by Siftrock
*/
/*.constant('RESPONSE_TYPES',
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
)*/

/*
*   These fields are support in integrations
*/
/*.constant('SIFTROCK_FIELDS',
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
);*/