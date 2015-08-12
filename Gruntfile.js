var async = require('async'),
    fs    = require('fs'),
    less  = require('less'),
    path  = require('path'),
    _     = require('underscore');

var config = require('./config/config.js');

var buildLocation = path.resolve(process.cwd(), '.build');
var distLocation = path.resolve(process.cwd(), '.dist');

var cacheBustMap = {};

module.exports = function(grunt) {

    // include some stuff
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-mocha-cli');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-cachebuster');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        paths: {
            build: buildLocation,
            dist: distLocation
        },
        less: {
            dev: {
                files: {
                    'app/public/css/clashtools.min.css': 'app/shared/less/clashtools.less'
                }
            },
            prod: {
                options: {
                    compress: true
                },
                files: {
                    'app/public/css/clashtools.min.css': 'app/shared/less/clashtools.less'
                }
            }
        },
        watch: {
            scripts: {
                files: [
                        'app/controllers/*.js',
                        'app/directives/**/*.js',
                        'app/services/*.js',
                        'app/shared/role-config.js'
                       ],
                tasks: ['concat', 'uglify:dev']
            },
            styles: {
                files: ['**/*.less'],
                tasks: ['less:dev']
            }
        },
        concat: {
            dist: {
                src: [
                    'app/controllers/*.js',
                    'app/directives/**/*.js',
                    'app/services/*.js'
                ],
                dest: 'app/public/js/resource.js'
            }
        },
        uglify: {
                prod: {
                    files: {
                        'app/public/js/resource.min.js' :
                            [
                                'app/controllers/*.js',
                                'app/directives/**/*.js',
                                'app/services/*.js'

                            ],
                        'app/public/js/roleconfig.min.js' :
                        [
                            'app/shared/role-config.js'
                        ]
                    }
                },
                dev: {
                    files: {
                        'app/public/js/roleconfig.min.js' :
                        [
                            'app/shared/role-config.js'
                        ]
                    }
                }
        },
        cachebuster: {
            prod: {
                options: {
                    format: 'json',
                    basedir: '<%= paths.build %>'
                },
                src: [
                    'app/public/css/*.css',
                    'app/public/js/*.min.js',
                    'app/public/js/webapp.js',
                    'app/public/vendor/css/fontello.css'
                ],
                dest: '<%= paths.build %>/config/cachebuster.json'
            }
        },
        clean: {
            build: ['<%= paths.build %>']
        },
        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        src: [
                            'api/**',
                            'app/public/favicon.ico',
                            'app/public/css/**',
                            'app/public/img/**',
                            'app/public/js/*.min.js',
                            'app/public/js/webapp.js',
                            'app/public/vendor/**',
                            'app/public/views/**',
                            'app/shared/*.js',
                            'app/app.js',
                            'bin/**',
                            'jobs/**',
                            'config/config.js',
                            'config/log4jsconfig.json',
                            'log/.gitkeep',
                            'package.json',
                            'server/**'
                        ],
                        dest: '<%= paths.build %>'
                    }
                ]
            },
            index: {
                src:  'app/public/index/index-prod.html',
                dest: '<%= paths.build %>/app/public/index/index.html',
                options: {
                    processContent: function(content, srcPath) {
                        // swap file names for cache-busting file names
                        cacheBustMap = helperGetCacheBust();
                        _.each(cacheBustMap, function (val, key) {
                            content = content.replace(key, val.data.newFileName);
                        });

                        return content;
                    }
                }
            },
            server: {
                src:  'server.js',
                dest: '<%= paths.build %>/clashtools-prod.js'
            },
            intercom_webapp: {
                src:  'app/public/js/webapp.js',
                dest: '<%= paths.build %>/app/public/js/webapp.js',
                options: {
                    processContent: function(content, srcPath) {
                        // replace dev/test analytics key with production key
                        var reg = new RegExp(config.env.development.intercom, 'g');
                        content = content.replace(reg, config.env.production.intercom);
                        return content;
                    }
                }
            }            
        },
        compress: {
            build: {
                options: {
                    archive: '<%= paths.dist %>/clashtools-<%= pkg.version %>.zip',
                    pretty: true,
                    level: 9
                },
                files: [
                    { cwd: '<%= paths.build %>', src: ['**'] }
                ]
            }
        },
        mochacli: {
            options: {
                ui: 'bdd',
                reporter: 'spec'
            },
            unit: {
                src: ['test/unit/**/*-spec.js']
            },
            functional: {
                src: ['test/functional/**/*-spec.js']
            }
        }
    });

    // Default task(s).
    grunt.registerTask('default', ['watch']);

    // Init tasks for first time code checkout/run
    grunt.registerTask('init', ['less:dev', 'concat', 'uglify:prod']);

    // Production build / release
    grunt.registerTask('build', ['less:prod', 
                                 'uglify:prod', 
                                 'clean:build', 
                                 'copy:build',                                 
                                 'cachebuster:prod', 
                                 'copy:index', 
                                 'copy:server', 
                                 'copy:intercom_webapp',                               
                                 'cachebust-rename', 
                                 'compress:build'
                                 ]);

    // Run unit tests
    grunt.registerTask('unit-test', ['mochacli:unit']);

    // Run functional tests
    grunt.registerTask('functional-test', ['mochacli:functional']);

    /*
    *   This is a custom task for renaming files to the cache-busting names created by the cachebuster task. That task creates the file map,
    *   but it does not rename the files. This task will go through and rename each file
    */
    grunt.registerTask('cachebust-rename', 'Custom cache busting', function () {

        // set this as an async task
        var done = this.async();

        cacheBustMap = helperGetCacheBust();
        var totRenamed = 0;

        //grunt.log.writeln(JSON.stringify(cacheBustMap));
        async.each(Object.keys(cacheBustMap), function (cb, callback) {
            var path = buildLocation + cacheBustMap[cb].data.path;
            //grunt.log.writeln(path);
            fs.rename(path + cb, path + cacheBustMap[cb].data.newFileName, function (err) {
                if (err) {
                    grunt.log.warn('File ' + cb + ' not found for cache busting');
                }
                else {
                    totRenamed++;
                }
                callback();
            });
        }, function (err) {
            grunt.log.writeln('Renamed ' + totRenamed.toString()['cyan'] + ' files for cache busting');
            done();
        });
    });
};

/*
*  Helper function to get cachebuster file names for use in various build tasks
*/
function helperGetCacheBust() {
    if (cacheBustMap.length > 0) {
        return cacheBustMap;
    }

    var data = JSON.parse(fs.readFileSync(buildLocation + '/config/cachebuster.json', 'utf8'));
    _.each(data, function (value, key) {
        pathparts = null;

        if (process.platform == 'win32') {
            pathparts = key.split('\\');
        }
        else {
            pathparts = key.split('/');
        }

        var fileparts = pathparts[pathparts.length-1].split('.');

        var newPath = null;
        if (process.platform == 'win32') {
            newPath = key.replace(pathparts[pathparts.length-1], '').replace('..\\', '\\')
        }
        else {
            newPath = key.replace(pathparts[pathparts.length-1], '').replace('../', '/');
        }

        cacheBustMap[pathparts[pathparts.length-1]] = {
            data:
                {
                    path: newPath,
                    newFileName: value + '.' + fileparts[fileparts.length-1]
                }
        };

    });
    return cacheBustMap;
}
