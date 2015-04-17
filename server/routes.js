/*
*   All routes (server and client) are configured here
*/

var _    = require('underscore'),
    path = require('path');

var authCtrl            = require('./controllers/auth-controller'),
    configCtrl          = require('./controllers/config-controller'),
    userCtrl            = require('./controllers/user-controller'),
    exportCtrl          = require('./controllers/export-controller'),
    accountCtrl         = require('./controllers/account-controller'),
    pwResetCtrl         = require('./controllers/pwreset-controller'),
    emailDetailCtrl     = require('./controllers/emaildetail-controller'),
    analyticsCtrl       = require('./controllers/analytics-controller'),
    dnsCtrl             = require('./controllers/dns-controller'),
    workflowCtrl        = require('./controllers/workflow-controller'),
    marketoCtrl         = require('./controllers/marketo-controller'),
    hubspotCtrl         = require('./controllers/hubspot-controller'),
    mailCtrl            = require('./controllers/mail-controller'),
    errorCtrl           = require('./controllers/error-controller'),
    messagelogCtrl      = require('./controllers/messagelog-controller'),
    nlpConfigCtrl       = require('./controllers/nlpconfig-controller'),
    User                = require('./models/user-model'),
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
        accessLevel: accessLevels.user
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
        accessLevel: accessLevels.user
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
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/account/:id/users',
        httpMethod: 'GET',
        middleware: [userCtrl.getByAccount],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/account/:id/users',
        httpMethod: 'POST',
        middleware: [accountCtrl.addUser],
        accessLevel: accessLevels.admin
    },
    {
        path: '/crud/user',
        httpMethod: 'GET',
        middleware: [userCtrl.allUsers],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/user/:id',
        httpMethod: 'GET',
        middleware: [userCtrl.getById],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/user/:id',
        httpMethod: 'POST',
        middleware: [userCtrl.save],
        accessLevel: accessLevels.admin
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
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/user/:id/session',
        httpMethod: 'POST',
        middleware: [userCtrl.saveUserSession],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/user/:id/meta',
        httpMethod: 'GET',
        middleware: [userCtrl.getMeta],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/user/:id/disable',
        httpMethod: 'POST',
        middleware: [userCtrl.disable],
        accessLevel: accessLevels.user
    },
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
        path: '/crud/mailstreamcount/:id',
        httpMethod: 'GET',
        middleware: [emailDetailCtrl.countByAccountId],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/mailstream/:id',
        httpMethod: 'GET',
        middleware: [emailDetailCtrl.findByAccountId],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/mailstream/:account_id/emaildetail/:email_id',
        httpMethod: 'GET',
        middleware: [emailDetailCtrl.findDetailAndRawById],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/mailstream/:account_id/hide/:email_id',
        httpMethod: 'POST',
        middleware: [emailDetailCtrl.setHidden],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/messagelog/:account_id',
        httpMethod: 'POST',
        middleware: [messagelogCtrl.save],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/messagelog/:user_id',
        httpMethod: 'GET',
        middleware: [messagelogCtrl.get],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/messagelog/:user_id/dismiss/:message_id',
        httpMethod: 'POST',
        middleware: [messagelogCtrl.dismiss],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/workflow/:accountId',
        httpMethod: 'GET',
        middleware: [workflowCtrl.getByAccount],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/workflow/:accountId/:workflowId',
        httpMethod: 'GET',
        middleware: [workflowCtrl.getById],
        accessLevel: accessLevels.user
    },
    {
        path: '/crud/workflow/:accountId',
        httpMethod: 'POST',
        middleware: [workflowCtrl.saveWorkflow],
        accessLevel: accessLevels.user
    },
    {
        path: '/analytics/summary/:account_id',
        httpMethod: 'GET',
        middleware: [analyticsCtrl.summary],
        accessLevel: accessLevels.user
    },
    {
        path: '/analytics/emailcountbyday/:account_id',
        httpMethod: 'GET',
        middleware: [analyticsCtrl.emailCountByDay],
        accessLevel: accessLevels.user
    },
    {
        path: '/analytics/emailcountbytype/:account_id',
        httpMethod: 'GET',
        middleware: [analyticsCtrl.emailCountByType],
        accessLevel: accessLevels.user
    },
    {
        path: '/analytics/personcountbytype/:account_id',
        httpMethod: 'GET',
        middleware: [analyticsCtrl.personCountByType],
        accessLevel: accessLevels.user
    },
    {
        path: '/analytics/allpeople/:account_id',
        httpMethod: 'GET',
        middleware: [analyticsCtrl.allPeople],
        accessLevel: accessLevels.user
    },
    {
        path: '/dns/mx/:domain',
        httpMethod: 'GET',
        middleware: [dnsCtrl.getMXRecords],
        accessLevel: accessLevels.user
    },
    {
        path: '/marketo/auth',
        httpMethod: 'POST',
        middleware: [marketoCtrl.verifyCredentials],
        accessLevel: accessLevels.user
    },
    {
        path: '/marketo/lists/:accountId',
        httpMethod: 'GET',
        middleware: [marketoCtrl.getLists],
        accessLevel: accessLevels.user
    },
    {
        path: '/marketo/fields/:accountId',
        httpMethod: 'GET',
        middleware: [marketoCtrl.getFields],
        accessLevel: accessLevels.user
    },
    {
        path: '/hubspot/auth/:accountId',
        httpMethod: 'GET',
        middleware: [hubspotCtrl.verifyCredentials],
        accessLevel: accessLevels.user
    },
    {
        path: '/hubspot/lists/:accountId',
        httpMethod: 'GET',
        middleware: [hubspotCtrl.getLists],
        accessLevel: accessLevels.user
    },
    {
        path: '/hubspot/fields/:accountId',
        httpMethod: 'GET',
        middleware: [hubspotCtrl.getFields],
        accessLevel: accessLevels.user
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
    {
        path: '/export/:id/allnames',
        httpMethod: 'GET',
        middleware: [exportCtrl.allNames]
    },
    {
        path: '/config/hubspot',
        httpMethod: 'GET',
        middleware: [configCtrl.hubspotConfig]
    },
    {
        path: '/crud/error',
        httpMethod: 'POST',
        middleware: [errorCtrl.save]
    },
    {
        path: '/crud/admin/account',
        httpMethod: 'GET',
        middleware: [accountCtrl.adminAllAccounts]
    },
    {
        path: '/crud/admin/nlpconfig',
        httpMethod: 'GET',
        middleware: [nlpConfigCtrl.get],
        accessLevel: accessLevels.sadmin
    },
    {
        path: '/crud/admin/nlpconfig',
        httpMethod: 'POST',
        middleware: [nlpConfigCtrl.save],
        accessLevel: accessLevels.sadmin
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
                User.updateLastLogin(id);
            }

            // temporary cookie to communicate to the client for this session
            res.cookie('f_user', JSON.stringify( {
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