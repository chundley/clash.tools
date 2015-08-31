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
    playerNotesCtrl     = require('./controllers/playernotes-controller'),
    banListCtrl         = require('./controllers/banlist-controller'),
    arrangedWarCtrl     = require('./controllers/arrangedwar-controller'),
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
        path: '/crud/user/limited/:userId',
        httpMethod: 'GET',
        middleware: [authorizeUserIdAccess, userCtrl.getByIdLimited],
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
        path: '/crud/user/:userId/roster',
        httpMethod: 'POST',
        middleware: [authorizeUserIdAccess, userCtrl.updateFromRoster],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/user/:userId/pw',
        httpMethod: 'POST',
        middleware: [userCtrl.changePassword]
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
        path: '/crud/user/:userId/join',
        httpMethod: 'POST',
        middleware: [authorizeUserIdAccess, userCtrl.joinClan],
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
    *   Player note endpoints
    */
    {
        path: '/crud/playernotes/:userId/:clanId',
        httpMethod: 'GET',
        middleware: [authorizeUserIdAccess, playerNotesCtrl.get],
        accessLevel: accessLevels.coleader
    },
    {
        path: '/crud/playernotes/:userId',
        httpMethod: 'POST',
        middleware: [authorizeUserIdAccess, playerNotesCtrl.save],
        accessLevel: accessLevels.coleader
    },
    {
        path: '/crud/playernotes/:clanId/:noteId',
        httpMethod: 'DELETE',
        middleware: [authorizeClanIdAccess, playerNotesCtrl.delete],
        accessLevel: accessLevels.coleader
    },
    /*
    *   Ban list endpoints
    */
    {
        path: '/crud/banlist/:clanId',
        httpMethod: 'GET',
        middleware: [authorizeClanIdAccess, banListCtrl.get],
        accessLevel: accessLevels.elder
    },
    {
        path: '/crud/banlist/:clanId',
        httpMethod: 'POST',
        middleware: [authorizeClanIdAccess, banListCtrl.save],
        accessLevel: accessLevels.coleader
    },
    {
        path: '/crud/banlist/:clanId/:userId',
        httpMethod: 'GET',
        middleware: [authorizeClanIdAccess, banListCtrl.getByUserId],
        accessLevel: accessLevels.coleader
    },
    {
        path: '/crud/banlist/:clanId/:userId',
        httpMethod: 'DELETE',
        middleware: [authorizeClanIdAccess, banListCtrl.delete],
        accessLevel: accessLevels.coleader
    },
    /*
    *   Clan endpoints
    */
    {
        path: '/crud/clan',
        httpMethod: 'POST',
        middleware: [authorizeClanIdAccess, clanCtrl.save],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/clan/:clanId',
        httpMethod: 'GET',
        middleware: [authorizeClanIdAccess, clanCtrl.getById],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/clan/:clanId',
        httpMethod: 'DELETE',
        middleware: [authorizeClanIdAccess, clanCtrl.delete],
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
    {
        path: '/crud/clan/:clanId/arrange',
        httpMethod: 'POST',
        middleware: [authorizeClanIdAccess, clanCtrl.arrangedWarRequest],
        accessLevel: accessLevels.coleader
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
    {
        path: '/crud/ar/user/:userId',
        httpMethod: 'GET',
        middleware: [authorizeUserIdAccess, attackResultsCtrl.findByUserId],
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
    *   Arranged war endpoints
    */
    {
        path: '/crud/arranged/:id',
        httpMethod: 'GET',
        middleware: [arrangedWarCtrl.getById],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/arranged/:clanId',
        httpMethod: 'POST',
        middleware: [authorizeClanIdAccess, arrangedWarCtrl.save],
        accessLevel: accessLevels.coleader
    },
    {
        path: '/crud/arranged/clan/:clanId',
        httpMethod: 'GET',
        middleware: [authorizeClanIdAccess, arrangedWarCtrl.getByClanId],
        accessLevel: accessLevels.member
    },
    {
        path: '/crud/arranged/:clanId/:id',
        httpMethod: 'POST',
        middleware: [authorizeClanIdAccess, arrangedWarCtrl.delete],
        accessLevel: accessLevels.coleader
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
        path: '/crud/verifyemail/:userId',
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
        path: '/crud/admin/clans/:query',
        httpMethod: 'GET',
        middleware: [clanCtrl.adminAllClans],
        accessLevel: accessLevels.sadmin
    },
    {
        path: '/crud/admin/clan/:clanId',
        httpMethod: 'GET',
        middleware: [clanCtrl.adminAllData],
        accessLevel: accessLevels.sadmin
    },
    {
        path: '/crud/admin/bounces',
        httpMethod: 'POST',
        middleware: [userCtrl.adminSetBounces],
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
    if (req.params.clanId && req.params.clanId.length > 0) {
        // standard request for information
        authCtrl.authClanAccessByClanId(req.user, req.method, req.params.clanId, function (err, authorized) {
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
    else {
        // special case - POST'ing data
        if (req.body._id) {
            // saving an existing clan, need to authorize
            authCtrl.authClanAccessByClanId(req.user, req.method, req.body._id, function (err, authorized) {
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
        else {
            // POST'ing a new clan
            return next();
        }
    }
}