/*global module:false*/
module.exports = function(grunt) {
  require("matchdep").filterDev("grunt-*").forEach(function (plugin) {
    grunt.loadNpmTasks(plugin);
  });

     // Default task.
  grunt.registerTask('default', ['less:raw', 'concat:js', 'watch']);
  grunt.registerTask('deploy', ['less:dist', 'concat:js', 'uglify:dist'])

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    // Task configuration.
    concat: {
      js: {
        src: [ 'src/utils/*.js', 'src/core/*js', 'src/game/*.js', 'src/main.js'],
        dest: 'build/app.js'
      }
    },
    uglify: {
      dist: {
        src: 'build/app.js',
        dest: 'build/app.js'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        browser: true,
        globals: {}
      },
      gruntfile: {
        src: 'Gruntfile.js'
      }
    },
    less: {
      raw: {
        files: {
          "build/app.css": "src/style/*.less"
        }
      },
      dist: {
        options: {
          compress: true
        },
        files: {
          "build/app.css": "src/style/*.less"
        }
      }
    },
    watch: {
      less: {
        files: 'src/style/*.less',
        tasks: ['less:raw']
      },
      js: {
        files: 'src/**/*.js',
        tasks: ['concat:js']
      },
      reload: {
        options: {
          livereload: true
        },
        files: ["src/**/*", "index.html"],
        tasks: []
      }
    }
  });

};
