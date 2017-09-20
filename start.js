/**
 * Created by cnn on 2017/07/18.
 */

var com = require('./common')
com.load()

var arg = process.argv && (process.argv.length >=2) && process.argv[2] || 'mini'
arg = arg == 'debug'?'mini':arg

console.log('[--- ',arg,' ---]')
switch (arg){
    case 'one':
        var inFile = process.argv && (process.argv.length >=3) && process.argv[3] || null;
        if (inFile)
            require('./minjs')
        break;
    case 'mini':
        require('./minjs')
        require('./mincss')
        break
    case 'clean':
        console.log ('Clean all: ' , com.config.mindestdir)
        com.deleteFolderRecursive(com.config.mindestdir, 1)
        break;

}

process.on('exit', function () {
    if (arg == 'mini') {
        com.save()
        com.dumpResult()
    }
});

