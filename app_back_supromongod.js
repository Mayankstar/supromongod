/*
 * Run `mongod` and connect to it
 **/

module.exports = supromongod

function supromongod(api, cfg){
var app = api.app, name = 'supromongod'
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
    if(!cfg.rbac){
        cfg.rbac = { can: { }}
    }
    // add `can` for toolbar with daemon handlers
    cfg.rbac.can['App.supromongod.view.ControlTools'] = true
    cfg.rbac.can['/supromongod/lib/'] = true

    return {
        css:['/css/' + name + '/css'],
        js: ['/' + name + '/app_front_' + name ],
        app_use: app_use,// call this *after* `mwBasicAuthorization()`
        cfg: cfg
    }

    function app_use(){
        app.use('/supromongod/lib/', mwMongoAPI)
        // order of priority; serve static files, css, l10n
        app.use('/' + name + '/', api.connect['static'](__dirname + '/'))
        app.use('/l10n/', api.mwL10n(api, __dirname, '_' + name + '.js'))
        app.use('/css/' + name + '/', api.connect['static'](__dirname + '/css/'))
        app.use('/css/' + name + '/css', api.connect.sendFile(
            __dirname + '/' + name + '.css', true)
        )
    }

    function mwMongoAPI(req, res, next){
    var ret = { success: true, data: '' }

        //req.session.can && req.session.can[]

        switch(req.url){// API is protected, thus `req.session` must be valid
            case '/log': ret.data = 'log'
            return api.connect.sendFile(cfg.log_filename, true)(req, res, next)

            case '/sts': ret.data = 'status'
                break
            case '/tst': ret.data = 'test'
                break
            case '/stp': ret.data = 'stop'
                break
            case '/rst': ret.data = 'restart'
                break
            case '/kill': ret.data = 'kill'
                break
            case '/user': ret.data = 'user'
                api.rbac(ret.data = { supromongod:{ cfg:{ rbac: mongo_rbac()}}})
                break
            default:break
        }
        return res.json(ret)
    }

    function mongo_rbac(){
        return {
            roles: {
                'mongo.role':[// new cans are merged
                    'module.supromongod',
                    '/supromongod/lib/',
                    'App.supromongod.view.ControlTools',

                    'App.um.wes',
                    'App.um.controller.Chat',
                    'App.um.view.Chat',
                    '/um/lib/wes',
                    '/um/lib/chat'
                ],
                'developer.local':[
                    'module.supromongod',//it has '*' but anyway
                    '/supromongod/lib/',// it has '*' but anyway
                    'App.supromongod.view.ControlTools',
                ]
            },
            users:{
                'mongo':{
                    id: 'mongo',
                    // require('crypto').createHash('sha1').update(pass).digest('hex')
                    pass: '9d4e1e23bd5b727046a9e3b4b7db57bd8d6ee684',
                    roles:[ 'mongo.role' ],
                    name: 'mongo role'
                }
            }
        }
    }
}
