/*
 * Run `mongod` and connect to it
 **/

module.exports = supromongod

function supromongod(api, modcfg){
var cfg, name = 'supromongod'
   ,path = require('path')

    if('boolean' != typeof modcfg){// not simple module enabler by 'true'
        cfg = (config_default(modcfg.port)).supromongod
        for(var f in modcfg){
            cfg[f] = modcfg[f]
        }
    } else {
        cfg = (config_default()).supromongod
    }

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
    } else if(!cfg.rbac.can){
        cfg.rbac.can = { }
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
    var app = api.app

        app.use('/' + name + '/lib/', require('./lib/api_load.js')(api, cfg))
        // order of priority; serve static files, css, l10n
        app.use('/' + name + '/', api.connect['static'](__dirname + '/'))
        app.use('/l10n/', api.mwL10n(api, __dirname, '_' + name + '.js'))
        app.use('/css/' + name + '/', api.connect['static'](__dirname + '/css/'))
        app.use('/css/' + name + '/css', api.connect.sendFile(
            __dirname + '/' + name + '.css', true)
        )
    }

    function config_default(port){
        return {// config part as it can be in main config file
        supromongod:{//'mongodb://' + process.env.MONGODS + process.env.MONGO_DBNAME
            // comment out `bin` if `mongodb[.exe]` is launched elsewhere
            bin: 'bin/mongod.exe',// if distro is used, put e.g. '/usr/bin/' here
            stop_on_restart: !true,// if `node.js` restarts stop `mongod` or not
            db_path: '/data/supromongod/',
            cmd_launch: '',
            log_filename: '',
            url: 'mongodb://127.0.0.1:' + (port || '27727') + '/'
           ,extjs:{ mongodb_port: (+port || 27727) }// App.cfg.modules.supromongod.extjs.mongodb_port
           ,db_name: 'supro_GLOB'
           ,options:{// you know what you are doing here!
                db:{
                    forceServerObjectId: true
                   ,bufferMaxEntries: 0
                   ,journal: true
                }
               ,server:{
                    auto_reconnect: true
                }
            }
           ,rbac:{
                roles:{
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
                    'developer.local':[// add to existing role
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
                        roles:['mongo.role'],
                        name: 'mongo role'
                    }
                }
            }
        }}// stands before userman for now
    }
}
