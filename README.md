supromongod
===========

supro mongodb launcher and db provider
![image](https://cloud.githubusercontent.com/assets/243627/4550850/ad526f2e-4e6a-11e4-8584-08ff2308af32.png)

#### Config example:

```js
    modules:{// cfg for stack of things from 'app_modules'
    // order matters: before auth module there are no restrictions to config
        supromongod:{//'mongodb://' + process.env.MONGODS + process.env.MONGO_DBNAME
            // comment out `bin` if `mongodb[.exe]` is launched elsewhere
            bin: 'bin/mongod.exe',// if distro is used, put e.g. '/usr/bin/' here
            stop_on_restart: !true,// if `node.js` restarts stop `mongod` or not
            db_path: '/data/supromongod/',
            cmd_launch: '',
            log_filename: '',
            url: 'mongodb://127.0.0.1:27727/'
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
        },
    // auth module overwrites default and sets up per-user auth module loading
        userman:{//#0: authentication and authorization (plus Chat)
```