// 引入 gulp
var gulp = require('gulp');
 
// 引入组件
var jshint = require('gulp-jshint'),//js检测
    uglify = require('gulp-uglify'),//js压缩
    concat = require('gulp-concat'),//文件合并
    rename = require('gulp-rename'),//文件更名
    header = require('gulp-header'),//添加文件头
    footer = require('gulp-footer'),//添加文件尾
    notify = require('gulp-notify');//提示信息

var pkg = require('../../package.json'); //项目配置文件
var version = '6.0.2';
var filelist = ['Zero.js', 'Callback.js', 'Event.js', 'Module.js', 'Msg.js', 'Http.js', 'URL.js', 'Util.js', 'versionmap.config.js', 'Page.js'];
//语法检查
gulp.task('jshint', function () {
    return gulp.src(filelist)
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

//压缩,合并 js
gulp.task('minifyjs', function () {
    return gulp.src(filelist) //需要操作的文件
    .pipe(jshint()) // 检查语法
    .pipe(concat('zero.m.debug-' + version + '.js')) //合并所有js到zero.js
    .pipe(header('(function() {\n')) //添加头
    .pipe(footer('\n})();')) //添加尾
    .pipe(gulp.dest('../'))  //输出到文件夹
    .pipe(rename('zero.m.min-' + version + '.js'))   //rename压缩后的文件名
    .pipe(uglify())//压缩
    .pipe(gulp.dest('../'));//成功
});

//默认命令，在cmd中输入gulp后，执行的就是这个任务(压缩js需要在检查js之后操作)
gulp.task('default',['minifyjs']);