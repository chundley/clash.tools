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
            user: 'clashtools',
            pwd: 'qv98M*1wa[',
            servers: [
                {
                    host: '127.0.0.1',
                    port: '27017'
                }
            ]
        },
        jobSchedule: {
            //purgeEmailJob: '* * * * * *' // run immediately in development
            purgeEmailJob: '5 * * * *' // run immediately in development
        },
        purgeDays: {
            purgeEmail: 30
        },        
        cookieSecret: 'clashtools_bab',
        logLevel: 'debug',
        mandrill: 'hYM_1Xl4pPKbF2EZR-pnmA',
        s3: {
            accessKeyId: 'AKIAJAFS45XYTNTOIAGA',
            secretAccessKey: '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',
            bucket: 'clashtools'
        }
    },
    production: {
        url: {
            host: '0.0.0.0',
            port: '80',
            base: 'http://clash.tools'
        },
        mongoDb: {
            dbName: 'clashtools',
            user: 'clashtools',
            pwd: 'u2p82KY#g!',
            servers: [
                {
                    host: '127.0.0.1',
                    port: '27017'
                }
            ]
        },
        jobSchedule: {
            purgEmailJob: '0 9 * * *'   // every day at 3AM PST
        },   
        purgeDays: {
            purgeEmail: 30
        },              
        cookieSecret: 'clashtools_kak',
        logLevel: 'info',
        mandrill: 'IAO8H52xJO-Lk-4_zBFcEQ',
        s3: {
            accessKeyId: 'AKIAJAFS45XYTNTOIAGA',
            secretAccessKey: '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',
            bucket: 'clashtools'
        }
    }
};

config.admins = [
    'chundley@gmail.com'
];

module.exports = config;
