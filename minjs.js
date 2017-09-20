/**
 * Created by cnn on 2017/07/18.
 */
var compressor = require('node-minify');
var path = require('path'), fs=require('fs');
var com = require('./common.js')
var UglifyJS = require("uglify-js");

var colors = require('colors');

var min2 = function (source, dest) {

    com.ensureDirectoryExistence(dest);
    var destUrl = dest.replace('../data','')
    var result = UglifyJS.minify({
        "source": fs.readFileSync(source, "utf8")
        }, {
            sourceMap: {
                filename: destUrl,
                //url: dest +".map"
            }
        }
    )//.code, "utf8");
    if (result && result.error) {
        console.log(result.error)
        return false;
    }

    fs.writeFileSync(dest, result.code,"utf8");
    fs.writeFileSync(dest+'.map', result.map,"utf8");

    return true;
}

com.load()
//com.isNew('../data/wordpress/wp-includes/js/tinymce/plugins/wordpress/plugin.js', 'aaa')

willdoJs = {};
if (typeof inFile == 'undefined') {
    com.fromDir(
        com.config.datadir, com.config.minijs.filter,
        function (srcFile, time) {
            // console.log(fileStat);
            var srcFile = srcFile.replace(/\\/g, '/')

            var dstFile = com.destFromSource(srcFile)//'../data/min'+ srcFile.replace(/..\/data/g,"");
            // console.log(srcFile.replace(path.delimiter,'\\') , '=>', dstFile);

            willdoJs[srcFile] = {dst: dstFile, time: time};
        },
        function (srcFile, time) {
            if (com.isNew(srcFile, time)) {
                if (com.copy(srcFile)) {
                    console.log('Copy: ', srcFile, ': ', "-> COPIED + TOUCH".green)
                    com.result.minijs.done++;
                    com.result.minijs.copy++;
                    com.updTime(srcFile, time)
                } else {
                    com.result.minijs.fail++;
                    console.log('Copy: ', srcFile, ': ', "-> COPY FAILED".red)
                }
            } else {
                com.result.minijs.bypass++;
                if (com.dbLv() > 0) console.log('Copy: ', srcFile, ': ', "-> BYPASS COPY".yellow)
            }
        },
        com.config.minijs.exclude
    );
}else{
    var inFile = process.argv && (process.argv.length >=3) && process.argv[3] || null;
    var srcFile = inFile.replace(/\\/g, '/')
    var dstFile = com.destFromSource(srcFile)//'../data/min'+ srcFile.replace(/..\/data/g,"");
    var stat = fs.lstatSync(inFile)
    var fileTime = stat.mtime.toISOString()
    willdoJs[srcFile] = {dst: dstFile, time: fileTime};
}

// console.log(willdoJs)
//
for (var key in willdoJs) {
    if (willdoJs.hasOwnProperty(key)) {
        // if (key=='../data/js/board.js') {

            if (com.isNew(key, willdoJs[key].time)) {
                if (min2(key, willdoJs[key].dst)) {
                    console.log('Mini: ', key, ' -> ', willdoJs[key].dst, 'time:', willdoJs[key].time, "-> MIN + TOUCH".green)
                    com.result.minijs.done++;
                    com.result.minijs.mini++;
                    com.updTime(key, willdoJs[key].time)
                } else {
                    com.result.minijs.fail++;
                    console.log('Mini: ', key, ' -> ', willdoJs[key].dst, 'time:', willdoJs[key].time, "-> MIN FAILED".red)
                }
            } else {
                com.result.minijs.bypass++;
                if (com.dbLv() > 0) console.log('Mini: ', key, ' -> ', willdoJs[key].dst, 'time:', willdoJs[key].time, "-> BYPASS".yellow)
            }
        }
    // }
}

com.save()


// var stat = fs.lstatSync('../data/js/board.js');
// console.log(stat)