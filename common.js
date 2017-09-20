/**
 * Created by cnn on 2017/07/18.
 */
var path = require('path'), fs=require('fs');
var colors = require('colors');

var fileTime = {}
var isWin = /^win/.test(process.platform);

module.exports = {
    ensureDirectoryExistence: function (filePath) {
        var dirname = path.dirname(filePath);
        if (fs.existsSync(dirname)) {
            return true;
        }
        this.ensureDirectoryExistence(dirname);
        fs.mkdirSync(dirname);
    },

    fromDir: function (startPath, filter, callback, copyCallBack, exclude) {

        //console.log('Starting from dir '+startPath+'/');

        if (!fs.existsSync(startPath)) {
            console.log("no dir ", startPath);
            return;
        }

        var files = fs.readdirSync(startPath);
        for (var i = 0; i < files.length; i++) {
            var filename = path.join(startPath, files[i]);
            var stat = fs.lstatSync(filename);
            if (stat.isDirectory()) {
                // by pass data/min dir
                //expReg = new RegExp('/data'+path.sep+'min/', 'g')
                if ( (this.config.excludeDirs.test(filename)) )
                    continue
                //if ( !(expReg.test(filename)) )
                this.fromDir(filename, filter, callback, copyCallBack, exclude); //recurse
            }
            else if (filter.test(filename)) {
                // console.log(filename);
                if (!exclude.test(filename)) { // not min js|css
                    callback(filename, stat.mtime.toISOString());
                } else { //file .min or .map -> copy
                    //this.copy(filename)
                    copyCallBack(filename, stat.mtime.toISOString())
                }
            }
        }
        ;
    },

    copy: function (filename) {
        var srcFile = filename.replace(/\\/g, '/')
        var dstFile = this.destFromSource(srcFile)
        this.ensureDirectoryExistence(dstFile)
        // console.log('Copy: ', srcFile, ' -> ', dstFile)
        fs.writeFileSync(dstFile, fs.readFileSync(srcFile), "utf8");
        return true
    },

    destFromSource: function (src) {
        return this.config.mindestdir + src.replace(/..\/data/g, "");
    },

    deleteFolderRecursive: function (path, keepTop) {
        var kt = typeof(keepTop)!=='undefined'
        if( fs.existsSync(path) ) {
            fs.readdirSync(path).forEach(function(file,index){
                var curPath = path + "/" + file;
                if(fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            if ( !(keepTop && this.config.mindestdir == path))
                fs.rmdirSync(path);
        }
    },

    isNew: function isNew(filepath, time){
        return time > (fileTime && fileTime[filepath] || '')
    },
    isFileChanged: function (filepath, time){
        var stat = fs.lstatSync(filepath)
        var fTime = stat.mtime.toISOString()
        // console.log(filepath, fTime, time)
        return fTime > time
    },
    // read depend info
    haveChildChanged: function (mainFilepath){
        if (fileTime['depend'] && fileTime['depend'][mainFilepath]){

            var depend = fileTime['depend'][mainFilepath]
            for (var key in depend) {
                if (depend.hasOwnProperty(key)) {
                    return (this.isFileChanged(key, depend[key]))
                }
            }

        }else{
            return true
        }
        return false
    },
    load: function (){
        var jsonfile = require('jsonfile')
        var file = this.config.mindestdir+'/filetime.json'
        //console.dir()
        try {
            fileTime = jsonfile.readFileSync(file)
        }catch (e){

        }
        // console.log('LOADED', filetime)
        return fileTime
    },
    save: function (){
        var jsonfile = require('jsonfile')
        console.log(11111111,this.config.mindestdir)
        var file = this.config.mindestdir + '/filetime.json'
        
        this.ensureDirectoryExistence(file)
        jsonfile.writeFileSync(file, fileTime, {spaces: 2})
    },
    updTime: function (filepath, time){
      fileTime[filepath] = time
    },
    updTimeDepend: function (parentpath, filepath){
        if (!fileTime['depend']) fileTime['depend'] = {}
        if (!fileTime['depend'][parentpath]) fileTime['depend'][parentpath] = {}
        var stat = fs.lstatSync(filepath)
        var fTime = stat.mtime.toISOString()
        fileTime['depend'][parentpath][filepath] = fTime
        // console.log (filetime)
    },
    dbLv: function (){
        var arg = process.argv && (process.argv.length >=2) && process.argv[2] || 'mini'
        return (arg == 'debug' && (process.argv.length >=3) &&  process.argv[3] || 1)
    },

    dumpResult: function (){
        var ret = this.result.minijs;
        console.log('=========================== JS ========================='.bold.yellow)
        console.log('Done:' + ret.done + ' Copy:'+ret.copy+ ' Minify:'+ret.mini+ ' Failed:'+ret.fail+ ' Bypass:'+ret.bypass)
        console.log('========================================================'.bold.yellow)
        ret = this.result.minicss;
        console.log('=========================== CSS ========================'.bold.yellow)
        console.log('Done:' + ret.done + ' Copy:'+ret.copy+ ' Minify:'+ret.mini+ ' Failed:'+ret.fail+ ' Bypass:'+ret.bypass)
        console.log('========================================================'.bold.yellow)
    },

    fileTime: function() {return fileTime},

    config: {
        // source dir: will be scanned to find css,js
        datadir: ".\/html",
        // destinate dir
        mindestdir: './html/min',
        // excluding dirs - would not be scanned
        excludeDirs: (isWin?/data\\(min|uploads|(wordpress\\wp-content\\uploads)|(wordpress\\wp-admin))/:/data\/(min|uploads|(wordpress\/wp-content\/uploads)|(wordpress\/wp-admin))/),
        // for js 
        minijs: {
            filter: /(\.js|\.js\.map|\.min\.js)$/,
            // not minify just copy (minified files ...)
            exclude: /(\.map|\.min|\/nls\/)/
        },
        // for css
        minicss:{
            filter: /(\.css|\.css\.map|\.min\.css)$/,
            // not minify just copy (minified files ...)
            exclude: /(\.map|\.min|\/nls\/)/
        }
    },
    result:{
        minijs: {
            done: 0,
            copy: 0,
            mini: 0,
            fail: 0,
            bypass:0
        },
        minicss:{
            done: 0,
            copy: 0,
            mini: 0,
            fail: 0,
            bypass:0
        }
    }


}



