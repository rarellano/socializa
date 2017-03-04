// Base gulp based on https://github.com/christianalfoni/react-app-boilerplate

var gulp = require('gulp');
var source = require('vinyl-source-stream'); // Used to stream bundle for further handling
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var notify = require('gulp-notify');
var concat = require('gulp-concat');
var cssmin = require('gulp-cssmin');
var gutil = require('gulp-util');
var glob = require('glob');
var livereload = require('gulp-livereload');
var connect = require('gulp-connect');
var copy = require('gulp-copy');
var less = require('gulp-less');
var cssimport = require("gulp-cssimport");
var removeHTML = require("gulp-remove-html");

// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
var dependencies = [
  'react', 'react-dom', 'react-router', 'qrcode.react',
  'html-purify',
  'jquery',
  'bootstrap',
  'openlayers',
  'moment',
  'fetch'
];

var browserifyTask = function (options) {

  // Our app bundler
  var appBundler = browserify({
    entries: [options.src], // Only need initial file, browserify finds the rest
    transform: [[babelify, {presets: ['es2015', 'react'], "plugins": ["transform-class-properties"]}]], // We want to convert JSX to normal javascript
    debug: options.development, // Gives us sourcemapping
    cache: {}, packageCache: {}, fullPaths: options.development // Requirement of watchify
  });

  dependencies.forEach(function (dep) {
    appBundler.external(dep);
  });

  // The rebundle process
  var rebundle = function () {
    var start = Date.now();
    console.log('Building APP bundle');
    appBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('main.js'))
      .pipe(gulp.dest(options.dest))
      .pipe(gulpif(options.development, livereload()))
      .pipe(notify(function () {
        console.log('APP bundle built in ' + (Date.now() - start) + 'ms');
      }));
  };

  // Fire up Watchify when developing
  if (options.development) {
    appBundler = watchify(appBundler);
    appBundler.on('update', rebundle);
  }

  rebundle();

  // We create a separate bundle for our dependencies as they
  // should not rebundle on file changes.
  var vendorsBundler = browserify({
    debug: options.development, // Gives us sourcemapping
    require: dependencies
  });

  // Run the vendor bundle
  var start = new Date();
  console.log('Building VENDORS bundle');
  vendorsBundler.bundle()
    .on('error', gutil.log)
    .pipe(source('vendors.js'))
    //.pipe(gulpif(!options.development, streamify(uglify())))
    .pipe(gulp.dest(options.dest))
    .pipe(notify(function () {
      console.log('VENDORS bundle built in ' + (Date.now() - start) + 'ms');
    }));
}

var cssTask = function (options) {
    if (options.development) {
      var run = function () {
        console.log(arguments);
        var start = new Date();
        console.log('Building CSS bundle');
        gulp.src(options.src)
          .pipe(cssimport({matchPattern: "*.css"}))
          .pipe(less())
          .pipe(concat('main.css'))
          .pipe(gulp.dest(options.dest))
          .pipe(notify(function () {
            console.log('CSS bundle built in ' + (Date.now() - start) + 'ms');
          }));
      };
      run();
      gulp.watch(options.src, run);
    } else {
      gulp.src(options.src)
        .pipe(cssimport({matchPattern: "*.css"}))
        .pipe(less())
        .pipe(concat('main.css'))
        .pipe(cssmin())
        .pipe(gulp.dest(options.dest));
    }

    gulp.src('node_modules/font-awesome/fonts/**')
        .pipe(gulp.dest(options.dest + '/fonts/'));
}

var copyFilesTask = function (options) {
  var dest = options.dest;
  gulp.src(["js/*"]).pipe(copy(dest, {prefix: 0}));
  gulp.src(["images/*"]).pipe(copy(dest, {prefix: 0}));
  gulp.src(["manifest.json"]).pipe(copy(dest, {prefix: 0}));
  gulp.src(["locales/**/*.json"]).pipe(copy(dest, {prefix: 0}));
}

var htmlReplaceTask = function (options) {
  var dest = options.dest;
  var src = gulp.src('index.html');
  if (options.build != 'app') {
        src.pipe(removeHTML({keyword: 'app'}));
  }
  if (options.build != 'web') {
        src.pipe(removeHTML({keyword: 'web'}));
  }
  src.pipe(gulp.dest(dest));
  //gulp.src(["index.html"]).pipe(copy('./build', {prefix: 0}));
}

// Starts our development workflow
gulp.task('default', function () {
  livereload.listen();

  browserifyTask({
    development: true,
    src: './src/main.js',
    dest: './build/app'
  });

  cssTask({
    development: true,
    src: './styles/app.less',
    dest: './build/app'
  });

  copyFilesTask({
    dest: './build/app'
  });

  htmlReplaceTask({
    build: 'web',
    dest: './build'
  });

  connect.server({
    root: 'build/',
    port: 8889
  });

});

gulp.task('deploy', function () {
  var build = 'web';
  if (process.argv.indexOf("--app") >= 0) {
    build = 'app';
  }

  browserifyTask({
    development: false,
    src: './src/main.js',
    dest: './dist/app'
  });

  cssTask({
    development: false,
    src: './styles/app.less',
    dest: './dist/app'
  });

  copyFilesTask({
    dest: './dist/app'
  });

  htmlReplaceTask({
    build: build,
    dest: './dist'
  });
});

var gulp = require('gulp');
var sort = require('gulp-sort');
var scanner = require('i18next-scanner');

gulp.task('i18next', function() {
    return gulp.src(['src/*.js'])
        .pipe(sort()) // Sort files in stream by path
        .pipe(scanner({
            lngs: ['es'], // supported languages
            func: {
                list: ['i18next.t', 'i18n.t', 't'],
            },
            ns: ['login', 'common'],
            resource: {
                // the source path is relative to current working directory
                loadPath: 'locales/{{lng}}/{{ns}}.json',

                // the destination path is relative to your `gulp.dest()` path
                savePath: '{{lng}}/{{ns}}.json'
            }
        }))
        .pipe(gulp.dest('locales'));
});
