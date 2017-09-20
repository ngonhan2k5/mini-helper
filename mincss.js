/**
 * Created by cnn on 2017/07/18.
 */

// var compressor = require('node-minify');
var path = require('path'), fs=require('fs');
var colors = require('colors');

var CleanCSS = require('clean-css');
// var source = 'a{font-weight:bold;}';
// var minified = new CleanCSS().minify(source).styles;

var com = require('./common.js')

function mincss(source, dest, callback) {
    //console.log(fs.readFileSync(source, "utf8"));return;

    var key = source, rebase = path.dirname(key);

    new CleanCSS({sourceMap: false, rebaseTo: rebase, inline: ['local']}).minify(
        {[source]: {styles: fs.readFileSync(source, "utf8")}},
        function (error, result) {
            // output.styles
            // console.log( result);

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
        // ,        function (minified) {
        //     console.log(arguments)
        //     // access minified.sourceMap for SourceMapGenerator object
        //     // see https://github.com/mozilla/source-map/#sourcemapgenerator for more details
        //     // see https://github.com/jakubpawlowicz/clean-css/blob/master/bin/cleancss#L114 on how it's used in clean-css' CLI
        // }
    )
    //     UglifyJS.minify({
    //         "source": fs.readFileSync(source, "utf8")
    //     }, {
    //         sourceMap: {
    //             filename: dest,
    //             //url: dest +".map"
    //         }
    //     }
    // )//.code, "utf8");

    // console.log(222,ret)
    // if (result && result.error)
    //     return false;
    // var sourceMap = result.sourceMap
    // sourceMap.setSourceContent(source,fs.readFileSync(source))
    // console.log(sourceMap.toString());
    //com.ensureDirectoryExistence(dest);
    //fs.writeFileSync(dest, result.styles,"utf8");
    // fs.writeFileSync(dest+'.map', result.sourceMap.toString() ,"utf8");
    // return true;
}
com.load()

var onMinied = function (e, r, key){
    //console.log(9999,e)
    if (e==null) {
        console.log('Mini: ', key, ' -> ', willdoCss[key].dst, 'time:', willdoCss[key].time, "-> MIN + TOUCH".green)
        com.result.minicss.done++;
        com.result.minicss.mini++;
        com.updTime(key, willdoCss[key].time)
        //if (r && r.inline)
        // console.log(r.inlinedStylesheets)
        if (r.inlinedStylesheets && Array.isArray(r.inlinedStylesheets)) {
            r.inlinedStylesheets.map( function (item) {
                // console.log(key, item)
                com.updTimeDepend(key, item)
            })

        }
    } else {
        com.result.minicss.fail++;
        console.log('Mini: ', key, ' -> ', willdoCss[key].dst, 'time:', willdoCss[key].time, "-> MIN FAILED".red)
    }

}

// mincss('./../data/wordpress/wp-content/themes/twentytwelve/css/top.css','./../data/min/wordpress/wp-content/themes/twentytwelve/css/top.css',
//     onMinied
// )
//

//
willdoCss = {};
com.fromDir(com.config.datadir, com.config.minicss.filter,
    // will minify files
    function(srcFile, time){
        var srcFile = srcFile.replace(/\\/g, '/')

        var dstFile = com.destFromSource(srcFile)//'../data/min'+ srcFile.replace(/..\/data/g,"");
        // console.log(srcFile.replace(path.delimiter,'\\') , '=>', dstFile);

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

//
// for (var key in willdoCss) {
//     if (willdoCss.hasOwnProperty(key)) {
//         console.log('Mini: ',key,' -> ', willdoCss[key])
//         mincss(key, willdoCss[key])
//         //console.log(key, willdoCss[key])
//
//     }
// }

for (var key in willdoCss) {
    if (willdoCss.hasOwnProperty(key)) {
        // if (key=='../data/js/board.js') {

        if (com.isNew(key, willdoCss[key].time) || com.haveChildChanged(key)) {
            // if (mincss(key, willdoCss[key].dst)) {
            //     console.log('Mini: ', key, ' -> ', willdoCss[key].dst, 'time:', willdoCss[key].time, "-> MIN + TOUCH".green)
            //     com.result.minicss.done++;
            //     com.result.minicss.mini++;
            //     com.updTime(key, willdoCss[key].time)
            // } else {
            //     com.result.minicss.fail++;
            //     console.log('Mini: ', key, ' -> ', willdoCss[key].dst, 'time:', willdoCss[key].time, "-> MIN FAILED".red)
            // }
            mincss(key, willdoCss[key].dst, onMinied)
        } else {
            com.result.minicss.bypass++;
            if (com.dbLv() > 0) console.log('Mini: ', key, ' -> ', willdoCss[key].dst, 'time:', willdoCss[key].time, "-> BYPASS".yellow)
        }
    }
    // }
}

com.save()