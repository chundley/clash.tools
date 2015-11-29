
/*
 * Shared utils
*/

var fs      = require('fs'),
    path    = require('path');

module.exports.createGUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}

/*
 *  Deep merge two objects together
 *  
 *  NOTE: exact values in obj2 will overwrite those in obj1. obj1 will be changed
 *  into the new object. Example call:
 *  
 *  collate(firstObject, secondObject);
 *  
 *  Now firstObject has all the properties of both objects
 */
module.exports.collate = function(obj1, obj2) {
    for (var p in obj2) {
        if (obj2[p].constructor == Object) {
            if (obj1[p]) {
                exports.collate(obj1[p], obj2[p]);
                continue;
            }
        }
        obj1[p] = obj2[p];
    }
}

module.exports.capitalizeFirstWord = function(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports.sortByKey = function(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
}

module.exports.zeroArray = function(length) {
    var intArray = [];
    while (length--) {
        intArray[length] = 0;
    }
    return intArray;
}

module.exports.initDateRangeData = function(start_date, end_date) {
    // make sure we don't clobber values
    var s_date = new Date(start_date);
    var e_date = new Date(end_date);

    var dates = [];
    while (s_date <= e_date) {
        dates.push(
            {
                date: s_date.getFullYear() + '/' + (s_date.getMonth()  + 1) + '/' + s_date.getDate(),
                count: 0
            }
        );
        s_date.setDate(s_date.getDate() + 1);
    }
    return dates;
}

/*
*   http://stackoverflow.com/questions/8667070/javascript-regular-expression-to-validate-url
*/
module.exports.validateUrl = function(url) {
    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
}

/*
* Tests for any number (positive and negative)
*/
module.exports.isNumber = function(num) {
    var numRegex = /^(\+|-)?((\d+(\.\d+)?)|(\.\d+))$/;
    if (numRegex.test(num)) {
        return true;
    }
    return false;
}

/*
* Tests for a positive integer
*/
module.exports.isPositiveInteger = function(num) {
    var intRegex = /^\d+$/;
    if(intRegex.test(num)) {
       return true;
    }
    return false;
}

/*
* Tests for a positive float
*/
module.exports.isPositiveFloat = function(num) {
    var floatRegex = /^(?=.+)(?:[1-9]\d*|0)?(?:\.\d+)?$/;
    if (floatRegex.test(num)) {
        return true;
    }
    return false;
}

module.exports.dedupStringArray = function(a) {
    var seen = {};
    return a.filter(function (item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}
