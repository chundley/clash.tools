/*
*   All routes (server and client) are configured here
*/

var _    = require('underscore'),
    path = require('path');

var authCtrl            = require('./controllers/auth-controller'),
    configCtrl          = require('./controllers/config-controller'),
    userCtrl            = require('./controllers/user-controller'),
    clanCtrl            = require('./controllers/clan-controller'),
    accountCtrl         = require('./controllers/account-controller'),
    pwResetCtrl         = require('./controllers/pwreset-controller'),
    mailCtrl            = require('./controllers/mail-controller'),
    errorCtrl           = require('./controllers/error-controller'),
    messagelogCtrl      = require('./controllers/messagelog-controller'),
    userModel           = require('./models/user-model'),
    userRoles           = require('../app/shared/role-config').userRoles,
    accessLevels        = require('../app/shared/role-config').accessLevels;

var routes = [
    {
        path: '/auth/register',
        httpMethod: 'POST',
        middleware: [authCtrl.register]
    },
    {
        path: '/auth/logout',
        httpMethod: 'POST',
        middleware: [authCtrl.logout],
        accessLevel: accessLevels.member
    },
    {
        path: '/auth/login',
        httpMethod: 'POST',
        middleware: [authCtrl.login]
    },
    {
        path: '/crud/account/:id',
        httpMethod: 'GET',
        middleware: [accountCtrl.findById],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/account',
        httpMethod: 'POST',
        middleware: [accountCtrl.save]
        // New user BUG
    },
    {
        path: '/crud/account/user/:id',
        httpMethod: 'GET',
        middleware: [accountCtrl.findByUserId],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/account/:id/users',
        httpMethod: 'GET',
        middleware: [userCtrl.getByAccount],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/account/:id/users',
        httpMethod: 'POST',
        middleware: [accountCtrl.addUser],
        accessLevel: accessLevels.member
    },
    /*
    *   User endpoints
    */
    {
        path: '/crud/user',
        httpMethod: 'GET',
        middleware: [userCtrl.allUsers],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:id',
        httpMethod: 'GET',
        middleware: [userCtrl.getById],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:id',
        httpMethod: 'POST',
        middleware: [userCtrl.save],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:id/pw',
        httpMethod: 'POST',
        middleware: [userCtrl.changePassword]
    },
    {
        path: '/crud/user/:id/session',
        httpMethod: 'GET',
        middleware: [userCtrl.getUserSession],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:id/session',
        httpMethod: 'POST',
        middleware: [userCtrl.saveUserSession],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:id/meta',
        httpMethod: 'GET',
        middleware: [userCtrl.getMeta],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:id/disable',
        httpMethod: 'POST',
        middleware: [userCtrl.disable],
        accessLevel: accessLevels.member
    },
    /*
    *   Clan endpoints
    */
    {
        path: '/crud/clan',
        httpMethod: 'POST',
        middleware: [clanCtrl.save],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/clan/:id',
        httpMethod: 'GET',
        middleware: [clanCtrl.getById],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/clans/:query',
        httpMethod: 'GET',
        middleware: [clanCtrl.allClans],
        accessLevel: accessLevels.public
    },
    /*
    *   Utility endpoints
    */
    {
        path: '/crud/verifyemail/:token',
        httpMethod: 'GET',
        middleware: [userCtrl.getByVerifyToken]
    },
    {
        path: '/crud/verifyemail/:id',
        httpMethod: 'POST',
        middleware: [userCtrl.setVerified]
    },
    {
        path: '/crud/pwreset/:token',
        httpMethod: 'GET',
        middleware: [pwResetCtrl.findByToken]
    },
    {
        path: '/crud/messagelog/:account_id',
        httpMethod: 'POST',
        middleware: [messagelogCtrl.save],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/messagelog/:user_id',
        httpMethod: 'GET',
        middleware: [messagelogCtrl.get],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/messagelog/:user_id/dismiss/:message_id',
        httpMethod: 'POST',
        middleware: [messagelogCtrl.dismiss],
        accessLevel: accessLevels.member
    },
    {
        path: '/mail/pwreset/:email',
        httpMethod: 'POST',
        middleware: [mailCtrl.pwReset]
    },
    {
        path: '/mail/verifyemail/:id',
        httpMethod: 'POST',
        middleware: [mailCtrl.verifyEmail]
    },
    {
        path: '/mail/welcome/:id',
        httpMethod: 'POST',
        middleware: [mailCtrl.welcome]
    },
    {
        path: '/mail/wwwform',
        httpMethod: 'POST',
        middleware: [mailCtrl.wwwForm]
    },
/*    {
        path: '/config/hubspot',
        httpMethod: 'GET',
        middleware: [configCtrl.hubspotConfig]
    },*/
    {
        path: '/crud/error',
        httpMethod: 'POST',
        middleware: [errorCtrl.save]
    },
/*    {
        path: '/crud/admin/account',
        httpMethod: 'GET',
        middleware: [accountCtrl.adminAllAccounts]
    },*/
    // AngularJS handles all other routes client-side
    {
        path: '/*',
        httpMethod: 'GET',
        middleware: [function (req, res) {

            // determine role from the request object (passport), or set to default
            var role = userRoles.public, email = '', id = 0;
            if (req.user) {
                role = req.user.role;
                email = req.user.email;
                id = req.user.id;
                userModel.updateLastLogin(id);
            }

            // temporary cookie to communicate to the client for this session
            res.cookie('clashtools_user', JSON.stringify( {
                id: id,
                email: email,
                role: role
            }));

            res.sendfile(path.resolve() + '/app/public/index/index.html');
        }]
    }
];

module.exports = function(app) {
    _.each(routes, function (route) {
        route.middleware.unshift(ensureAuthorized);
        var args = _.flatten([route.path, route.middleware]);

        switch(route.httpMethod.toUpperCase()) {
            case 'GET':
                app.get.apply(app, args);
                break;
            case 'POST':
                app.post.apply(app, args);
                break;
            case 'PUT':
                app.put.apply(app, args);
                break;
            case 'DELETE':
                app.delete.apply(app, args);
                break;
            default:
                throw new Error('Invalid HTTP method specified for route ' + route.path);
                break;
        }
    });
}

/*
*   Validates access level for routes
*/
function ensureAuthorized(req, res, next) {
    var role;
    if(!req.user) {
        role = userRoles.public;
    }
    else {
        role = req.user.role;
    }

    var accessLevel = _.findWhere(routes, { path: req.route.path }).accessLevel || accessLevels.public;

    if(!(accessLevel.bitMask & role.bitMask)) {
        return res.send(403);
    }

    return next();
}