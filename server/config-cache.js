/*
 *  Cache to hold configuration, merging standard config with sensitive config
 *  and stored in a singleton for easy access
 */

var utils = require('../app/shared/util');

var ConfigCache = function () {
    return {
        /*
         *  Combines the standard configuration with xConfig - the sensitive portions not
         *  stored in source control
         */
        initConfig: function () {
            var config = require('../config/config');
            
            // c-config should be located one level up from the project
            var cConfig = require('../../c-config.js');

            utils.collate(config, cConfig);
            return config;
        }
    }
}

module.exports = ConfigCache;
