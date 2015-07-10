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
    attackResultsCtrl   = require('./controllers/attackresult-controller'),
    emailMessageCtrl    = require('./controllers/emailmessage-controller'),
    pwResetCtrl         = require('./controllers/pwreset-controller'),
    mailCtrl            = require('./controllers/mail-controller'),
    errorCtrl           = require('./controllers/error-controller'),
    messagelogCtrl      = require('./controllers/messagelog-controller'),
    imageUploadCtrl     = require('./controllers/imageupload-controller'),
    analyticsCtrl       = require('./controllers/analytics-controller'),
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
        path: '/crud/user/:userId',
        httpMethod: 'GET',
        middleware: [authorizeUserIdAccess, userCtrl.getById],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:userId',
        httpMethod: 'POST',
        middleware: [authorizeUserIdAccess, userCtrl.save],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:userId/role',
        httpMethod: 'POST',
        middleware: [authorizeUserIdAccess, userCtrl.updateRole],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:userId/clan',
        httpMethod: 'POST',
        middleware: [authorizeUserIdAccess, userCtrl.updateClan],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:userId/pw',
        httpMethod: 'POST',
        middleware: [authorizeUserIdAccess, userCtrl.changePassword]
    },
    {
        path: '/crud/user/:userId/session',
        httpMethod: 'GET',
        middleware: [authorizeUserIdAccess, userCtrl.getUserSession],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:userId/session',
        httpMethod: 'POST',
        middleware: [authorizeUserIdAccess, userCtrl.saveUserSession],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:userId/meta',
        httpMethod: 'GET',
        middleware: [authorizeUserIdAccess, userCtrl.getMeta],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:userId/disable',
        httpMethod: 'POST',
        middleware: [authorizeUserIdAccess, userCtrl.disable],
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
        path: '/crud/clan/:clanId',
        httpMethod: 'GET',
        middleware: [authorizeClanIdAccess, clanCtrl.getById],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/clan/:clanId/members',
        httpMethod: 'GET',
        middleware: [authorizeClanIdAccess, clanCtrl.getByClan],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/clan/:clanId/roster',
        httpMethod: 'GET',
        middleware: [authorizeClanIdAccess, clanCtrl.getRoster],
        accessLevel: accessLevels.coleader
    },
    {
        path: '/crud/clans/:query',
        httpMethod: 'GET',
        middleware: [clanCtrl.allClans],
        accessLevel: accessLevels.member
    },
    /*
    *   Attack result endpoints
    */
    {
        path: '/crud/ar/:clanId',
        httpMethod: 'GET',
        middleware: [attackResultsCtrl.findByClanId],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/ar/war/:warId',
        httpMethod: 'GET',
        middleware: [attackResultsCtrl.findByWarId],
        accessLevel: accessLevels.member
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
        path: '/crud/war/:id',
        httpMethod: 'DELETE',
        middleware: [warCtrl.delete],
        accessLevel: accessLevels.leader
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
    {
        path: '/crud/war/:warId/base/:baseNum/image',
        httpMethod: 'POST',
        middleware: [warCtrl.saveBaseImage],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/war/:warId/base/:baseNum/note',
        httpMethod: 'POST',
        middleware: [warCtrl.addBaseNote],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/war/:warId/base/:baseNum/note',
        httpMethod: 'DELETE',
        middleware: [warCtrl.deleteBaseNote],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/wars/:clanId',
        httpMethod: 'GET',
        middleware: [warCtrl.getHistory],
        accessLevel: accessLevels.member
    },
    /*
    *   Analytics endpoints
    */
    {
        path: '/analytics/summary',
        httpMethod: 'GET',
        middleware: [analyticsCtrl.summaryMetrics]
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
    *   Image upload endpoints
    */
    {
        path: '/crud/image/avatar/:userId',
        httpMethod: 'POST',
        middleware: [imageUploadCtrl.uploadAvatar]
    },
    {
        path: '/crud/image/clan/:clanId',
        httpMethod: 'POST',
        middleware: [imageUploadCtrl.uploadClan]
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
    /*
    *   Admin / management endpoints
    */
    {
        path: '/crud/admin/clan/:clanId',
        httpMethod: 'GET',
        middleware: [clanCtrl.adminAllData],
        accessLevel: accessLevels.sadmin
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

/*
*   Authorize access to user detail records, by user id
*/
function authorizeUserIdAccess(req, res, next) {
    authCtrl.authUserAccessByUserId(req.user, req.params.userId, function (err, authorized) {
        if (err) {
            return res.send(500, err);
        }
        else if (!authorized) {
            return res.send(403);
        }
        else {
            return next();
        }
    });
}

function authorizeClanIdAccess(req, res, next) {
    authCtrl.authClanAccessByClanId(req.user, req.params.clanId, function (err, authorized) {
        if (err) {
            return res.send(500, err);
        }
        else if (!authorized) {
            return res.send(403);
        }
        else {
            return next();
        }
    });
}