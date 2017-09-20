/**
 * Created by cnn on 2017/07/18.
 */
var path = require('path'), fs=require('fs');
var colors = require('colors');

var CleanCSS = require('clean-css');

var com = require('./common.js')

function mincss(source, dest, callback) {

    var key = source, rebase = path.dirname(key);

    new CleanCSS({sourceMap: false, rebaseTo: rebase, inline: ['local']}).minify(
        {[source]: {styles: fs.readFileSync(source, "utf8")}},
        function (error, result) {

            if (result && result.styles) {

                com.ensureDirectoryExistence(dest);
                fs.writeFileSync(dest, result.styles, "utf8");
            }
            if (result && result.sourceMap) {
                var sourceMap = result.sourceMap
                sourceMap.setSourceContent(source, fs.readFileSync(source))
                //console.log(sourceMap.toString());
                fs.writeFileSync(dest + '.map', result.sourceMap.toString(), "utf8");
            }
            if (typeof callback == 'function') callback(error, result, source)
        }
    )
}

var onMinied = function (e, r, key){
    if (e==null) {
        console.log('Mini: ', key, ' -> ', willdoCss[key].dst, 'time:', willdoCss[key].time, "-> MIN + TOUCH".green)
        com.result.minicss.done++;
        com.result.minicss.mini++;
        com.updTime(key, willdoCss[key].time)

        if (r.inlinedStylesheets && Array.isArray(r.inlinedStylesheets)) {
            r.inlinedStylesheets.map( function (item) {
                com.updTimeDepend(key, item)
            })
        }

    } else {
        com.result.minicss.fail++;
        console.log('Mini: ', key, ' -> ', willdoCss[key].dst, 'time:', willdoCss[key].time, "-> MIN FAILED".red)
    }

}


willdoCss = {};
com.fromDir(com.config.datadir, com.config.minicss.filter,
    // will minify files
    function(srcFile, time){
        var srcFile = srcFile.replace(/\\/g, '/')

        var dstFile = com.destFromSource(srcFile)

        willdoCss[srcFile] = {dst:dstFile, time: time};
    },
    // will copy files
    function(srcFile, time){
        if (com.isNew(srcFile, time)) {
            if (com.copy(srcFile)) {
                console.log('Copy: ', srcFile, ': ', "-> COPIED + TOUCH".green)
                com.result.minicss.done++;
                com.result.minicss.copy++;
                com.updTime(srcFile, time)
            } else{
                com.result.minicss.fail++;
                console.log('Copy: ', srcFile, ': ',"-> COPY FAILED".red)
            }
        } else {
            com.result.minicss.bypass++;
            if (com.dbLv()>0) console.log('Copy: ', srcFile, ': ', "-> BYPASS COPY".yellow)
        }
    },
    com.config.minicss.exclude );

// do minify
for (var key in willdoCss) {
    if (willdoCss.hasOwnProperty(key)) {

        if (com.isNew(key, willdoCss[key].time) || com.haveChildChanged(key)) {
            mincss(key, willdoCss[key].dst, onMinied)
        } else {
            com.result.minicss.bypass++;
            if (com.dbLv() > 0) console.log('Mini: ', key, ' -> ', willdoCss[key].dst, 'time:', willdoCss[key].time, "-> BYPASS".yellow)
        }
    }
}