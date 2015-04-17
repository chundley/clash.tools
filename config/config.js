// # siftrock-app configuration

var config = {};

config.env = {
    development: {
        url: {
            host: '127.0.0.1',
            port: '7993',
            ssl_port: '7994',
            base: 'http://localhost:7993'
        },
        mongoDb: {
            dbName: 'siftrock_dev',
            user: 'siftrock',
            pwd: 'p{97Jf]mn3',
            servers: [
                {
                    host: '127.0.0.1',
                    port: '27017'
                }
            ]
        },
        hubspotApi: {
            clientId: 'cbf0bffd-c2d6-11e4-b94f-3565887180c8',
            clientSecret: '4c83de50-0de2-4e5a-ac5c-b3d90adddddd',
            authUrl: 'https://app.hubspot.com/auth/authenticate',
            redirectUrl: 'http://localhost:7993/settings/integration/hubspot',
            baseUrl: 'https://api.hubapi.com'
        },
        wwwSite: 'http://localhost:8080',
        mxRecord: 'mail.siftrock.com',
        cookieSecret: 'abcxyz12',
        logLevel: 'debug',
        mixpanel: '726a28dc2c661988df5c15493778c49a',
        gh: 'dace52f944908e053cb7cb6ecad8719efa3e5903',
        mandrill: 'EXW7zd8apIL6mWh5QbUXlQ'
    },
    production: {
        url: {
            host: '0.0.0.0',
            port: '7993',
            ssl_port: '443',
            base: 'https://app.siftrock.com'
        },
        mongoDb: {
            dbName: 'siftrock',
            user: 'siftrock',
            pwd: 't6+17R}a$8',
            servers: [
                {
                    host: 'siftrock-db1',
                    port: '27017'
                },
                {
                    host: 'siftrock-db2',
                    port: '27017'
                }
            ]
        },
        hubspotApi: {
            clientId: 'cbf0bffd-c2d6-11e4-b94f-3565887180c8',
            clientSecret: '4c83de50-0de2-4e5a-ac5c-b3d90adddddd',
            authUrl: 'https://app.hubspot.com/auth/authenticate',
            redirectUrl: 'https://app.siftrock.com/settings/integration/hubspot',
            baseUrl: 'https://api.hubapi.com'
        },
        wwwSite: 'http://www.siftrock.com',
        mxRecord: 'mail.siftrock.com',
        cookieSecret: 'qrshij72',
        logLevel: 'info',
        mixpanel: '1baaef477804edefd768bb41f68eb9ac',
        gh: 'dace52f944908e053cb7cb6ecad8719efa3e5903',
        mandrill: 'IrTUE_HblIrL9uQD2d7Vmg'
    }
};

config.demoDomain = 'demo.siftrock.com';

config.admins = [
    'chris@siftrock.com'
];

module.exports = config;
