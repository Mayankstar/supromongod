/*
 * Run `mongod` and connect to it
 **/

module.exports = supromongod

function supromongod(api, cfg){
var n, app = api.app, name = 'supromongod'
   ,path = require('path')

    cfg.db_path = path.normalize(
        //  $PWD/app_modules/supromongod/ -> $PWD/data/supromongod/
        __dirname + '/../..' + (cfg.db_path || '/data/supromongod/')
    )
    if(cfg.bin){
        cfg.bin = path.normalize(__dirname + '/' + cfg.bin)
    }
    require('./lib/mongodb.js')[cfg.bin ? 'launch' : 'connect'](
        api, cfg
    )

    /* == admin/status UI && API: == */

    // order of priority; serve static files, css, l10n
    app.use('/' + name, api.connect['static'](__dirname + '/'))
    app.use('/l10n/', api.mwL10n(api, __dirname, '_' + name + '.js'))
    app.use('/css/' + name, api.connect['static'](__dirname + '/css/'))
    n = '/css/' + name + '/css'
    app.use(n, api.connect.sendFile(__dirname + name + '.css', true))

    // TODO API to control and getting update of logfile

    return { css:[ n ], js:[ '/' + name + '/app_front_' + name ], cfg: cfg }
}
