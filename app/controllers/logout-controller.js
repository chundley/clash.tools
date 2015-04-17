'use strict';

/*
*   Controller for logging out
*/

angular.module('SiftrockApp.controllers')
.controller('LogoutCtrl', ['$location', 'authService', 'sessionService', 'errorService',
function ($location, authService, sessionService, errorService) {
    authService.logout(function (err) {
    	if (err) {
            err.stack_trace.unshift( { file: 'logout-controller.js', func: 'init', message: 'Error on logout' } );
            errorService.save(err, function() {});
    	}
    	else {
	        // clear browser-stored session
	        sessionService.clearSession();
    	}

    	$location.path('/login');
    });

}]);