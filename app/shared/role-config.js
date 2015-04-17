/*
*   Modification of code from http://www.frederiknakstad.com/authentication-in-single-page-applications-with-angular-js/
*
*   Authorization shared for both server and client. Will be minified for the client app
*   and used directly for the server authorization.
*
*   Bit mask implementation to authorize access to UI features and service API's:
*
*   Roles (limit 31)
*   -------------------------
*   public:     0001
*   user:       0010
*   admin:      0100
*   sadmin:     1000
*
*   Access levels (whom has access to what)
*   -------------------------
*   public:     1111  (all roles)
*   anon:       0001  (public)
*   user:       1110  (user, admin, sadmin)
*   admin:      1100  (admin, sadmin)
*   sadmin:     1000  (sadmin)
*/


(function(exports){

    var config = {
        /*
        *   Roles in the array become bitmasks shifting one bit to the left
        */
        roles :[
            'public',
            'user',
            'admin',
            'sadmin'],

        /*
        *   Build out all the access levels you want referencing the roles listed above
        *   Use the "*" symbol to represent access to all roles
        */
        accessLevels : {
            'public' : "*",
            'anon': ['public'],
            'user' : ['user', 'admin', 'sadmin'],
            'admin': ['admin','sadmin'],
            'sadmin': ['sadmin']
        }

    }

    exports.userRoles = buildRoles(config.roles);
    exports.accessLevels = buildAccessLevels(config.accessLevels, exports.userRoles);

    /*
    *   Method to build a distinct bit mask for each role
    *   It starts off with "1" and shifts the bit to the left for each element in the
    *   roles array parameter
    */
    function buildRoles(roles){

        var bitMask = "01";
        var userRoles = {};

        for(var role in roles) {
            var intCode = parseInt(bitMask, 2);
            userRoles[roles[role]] = {
                bitMask: intCode,
                title: roles[role]
            };
            bitMask = (intCode << 1 ).toString(2)
        }
        return userRoles;
    }

    /*
    *   This method builds access level bit masks based on the accessLevelDeclaration parameter which must
    *   contain an array for each access level containing the allowed user roles.
     */
    function buildAccessLevels(accessLevelDeclarations, userRoles){

        var accessLevels = {};
        for(var level in accessLevelDeclarations) {

            if(typeof accessLevelDeclarations[level] == 'string') {
                if(accessLevelDeclarations[level] == '*') {

                    var resultBitMask = '';

                    for( var role in userRoles){
                        resultBitMask += "1"
                    }
                    accessLevels[level] = {
                        title: level,
                        bitMask: parseInt(resultBitMask, 2)
                    };
                }
                else {
                    console.log("Access Control Error: Could not parse '" + accessLevelDeclarations[level] + "' as access definition for level '" + level + "'")
                }

            }
            else {

                var resultBitMask = 0;
                for(var role in accessLevelDeclarations[level]) {
                    if(userRoles.hasOwnProperty(accessLevelDeclarations[level][role])) {
                        resultBitMask = resultBitMask | userRoles[accessLevelDeclarations[level][role]].bitMask
                    }
                    else {
                        console.log("Access Control Error: Could not find role '" + accessLevelDeclarations[level][role] + "' in registered roles while building access for '" + level + "'")
                    }
                }
                accessLevels[level] = {
                    title: level,
                    bitMask: resultBitMask
                };
            }
        }
        return accessLevels;
    }

})(typeof exports === 'undefined' ? this['roleConfig'] = {} : exports);
