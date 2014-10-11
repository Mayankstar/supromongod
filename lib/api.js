/*
 * Reloaded API code
 */

function supromongodAPI(ret, api, local, req, res, next){
    switch(local.url.pathname){
        case '/log':
        return api.connect.sendFile(local.cfg.log_filename, true)(req, res, next)

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
        default:
            ret.success = !(ret.err = '!such_subapi: ' + local.url.pathname)
            log(ret.err)
            break
    }
    return setImmediate(ret_data)// async always
}

function ret_data(){
    return res.json(ret)
}

function mongo_rbac(){
    return {
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
}

supromongodAPI(ret, api, local, req, res, next)
return true// async always
