// # clashtools configuration

var config = {};

config.env = {
    development: {
        url: {
            host: '127.0.0.1',
            port: '7997',
            base: 'http://localhost:7997'
        },
        mongoDb: {
            dbName: 'clashtools_dev',
            servers: [
                {
                    host: '127.0.0.1',
                    port: '27017'
                }
            ]
        },
        redis: {
            host: 'localhost',
            port: '6379'
        },
        jobSchedule: {
            //purgeEmailJob: '* * * * * *', // (testing) run immediately in development
            //purgeMessagelogJob: '* * * * * *' // (testing) run immediately in development
            purgeEmailJob: '0 8 * * *',        // every day at 2AM PST
            purgeMessagelogJob: '0 9 * * *'   // every day at 3AM PST
        },
        purgeDays: {
            purgeEmail: 30,
            purgeMessagelog: 30
        },
        cookieSecret: 'clashtools_bab',
        logLevel: 'debug'
    },
    production: {
        url: {
            host: '0.0.0.0',
            port: '7997',
            base: 'http://clash.tools'
        },
        mongoDb: {
            dbName: 'clashtools',
            servers: [
                {
                    host: 'ct-db1',
                    port: '27017'
                }
            ]
        },
        redis: {
            host: 'ct-db1',
            port: '6379'
        },
        jobSchedule: {
            purgeEmailJob: '0 8 * * *',        // every day at 2AM PST
            purgeMessagelogJob: '0 9 * * *'   // every day at 3AM PST
        },
        purgeDays: {
            purgeEmail: 30,
            purgeMessagelog: 30
        },
        cookieSecret: 'clashtools_kak',
        logLevel: 'info',
    }
};

config.admins = [
    'fieldsg22@outlook.com'
];

module.exports = config;
