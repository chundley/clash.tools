/*
*   All routes (server and client) are configured here
*/

var _    = require('underscore'),
    path = require('path');

var authCtrl            = require('./controllers/auth-controller'),
    configCtrl          = require('./controllers/config-controller'),
    userCtrl            = require('./controllers/user-controller'),
    clanCtrl            = require('./controllers/clan-controller'),
    warCtrl             = require('./controllers/war-controller'),
    emailMessageCtrl    = require('./controllers/emailmessage-controller'),
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
        path: '/crud/user/:id/role',
        httpMethod: 'POST',
        middleware: [userCtrl.updateRole],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:id/clan',
        httpMethod: 'POST',
        middleware: [userCtrl.updateClan],
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
        path: '/crud/clan/:clanId/members',
        httpMethod: 'GET',
        middleware: [clanCtrl.getByClan],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/clans/:query',
        httpMethod: 'GET',
        middleware: [clanCtrl.allClans],
        accessLevel: accessLevels.public
    },
    /*
    *   War endpoints
    */
    {
        path: '/crud/war/:id',
        httpMethod: 'GET',
        middleware: [warCtrl.getById],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/war/:clanId/active',
        httpMethod: 'GET',
        middleware: [warCtrl.activeWar],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/war/:clanId/active/admin',
        httpMethod: 'GET',
        middleware: [warCtrl.activeWarAdmin],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/war',
        httpMethod: 'POST',
        middleware: [warCtrl.save],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/war/assign/:warId',
        httpMethod: 'POST',
        middleware: [warCtrl.assignBase],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/war/stars/:warId',
        httpMethod: 'POST',
        middleware: [warCtrl.updateStars],
        accessLevel: accessLevels.member
    },
    /*
    *   App email endpoints
    */
    {
        path: '/crud/email',
        httpMethod: 'POST',
        middleware: [emailMessageCtrl.save],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/email',
        httpMethod: 'GET',
        middleware: [emailMessageCtrl.get],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/email/:messageId',
        httpMethod: 'GET',
        middleware: [emailMessageCtrl.getById],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/email/:messageId/:userId',
        httpMethod: 'POST',
        middleware: [emailMessageCtrl.setRead],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/email/:messageId/:userId',
        httpMethod: 'DELETE',
        middleware: [emailMessageCtrl.delete],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/email/countnew/:userId',
        httpMethod: 'GET',
        middleware: [emailMessageCtrl.countNew],
        accessLevel: accessLevels.member
    },
    /*
    *   User account management endpoints
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
    /*
    *   Messagelog endpoints
    */
    {
        path: '/crud/messagelog/:clanId',
        httpMethod: 'POST',
        middleware: [messagelogCtrl.save],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/messagelog/:clanId',
        httpMethod: 'GET',
        middleware: [messagelogCtrl.get],
        accessLevel: accessLevels.member
    },
    /*
    *   Email send endpoints
    */
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