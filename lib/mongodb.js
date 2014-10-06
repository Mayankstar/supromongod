/*
 * Start/Restart/Stop mongodb service (daemon)
 * Setup robust MongoDB connection using native driver
 * NOTE default port = 27727
 */
(function MongoDB(module){


/* ,-< Stop mongod Processes >-
 * |
 * |In a clean shutdown a mongod completes all pending operations,
 * |flushes all data to data files, and closes all data files.
 * |Other shutdowns are unclean and can compromise the validity the data files.
 * |
 * `-<http://docs.mongodb.org/manual/tutorial/manage-mongodb-processes/>
 *
 * Our Clean shutdown stratery is to run
 * > db.admin.command({ shutdown: 1 })
 *
 * on shutdown event `mongod` will finish all pending requests (as per docs)
 * and then close event of `db` will free everything in the driver
 * no need of internal accounting and/or checking of
 * `serverStatus.metrics.cursor.open.total` on db.close()
 */

var mongodb = require('mongodb')
// module data
var mongod// spawned daemon
var db, api, cfg
var colls_cache = { }// collections which may have additional dynamic fields

// API for Mongodb access
var mongodbAPI = {
        client: null,// TODO?: setter, getter
        // methods
        launch: launch_daemon,
        connect: mongodb_connect
    }

    return module.exports = mongodbAPI

function launch_daemon(config, app_api){
var cwd, d

    if(!config || !app_api) throw new Error('!Undefined arguments')

    cfg = config
    api = app_api

    //  $PWD/app_modules/supromongod/lib/ -> $PWD/data/supromongod/
    cwd = __dirname + '/../../..' + (config.db_path || '/data/supromongod/')
    try {
        d = require('fs').statSync(cwd)
    } catch(ex){
        return require('mkdirp').mkdirp(cwd,
        function mkdirp_data_dir(err){
            if(err) throw err

            return spawn_mongod(cwd)
        })
    }
    if(!d.isDirectory()){
        throw new Error('Is not a directory: ' + cwd)
    }
    return spawn_mongod(cwd)
}

function pad(n){
    return n < 10 ? '0' + n : n
}

function spawn_mongod(cwd){
var cmd, path, lf, cp, fs

    path = require('path')
    fs = require('fs')
    cp = require('child_process')

    cwd = path.normalize(cwd)

    lf = new Date
    lf = cwd + lf.getUTCFullYear() + '-' + pad(lf.getUTCMonth() + 1) + '.txt'

    /* run repair stage */
    cmd = {
        bin:(cfg.bin ?
            path.normalize(__dirname + '/../' + cfg.bin) :
            '/usr/local/bin/mongod'
        ),
        arg:(// check and apply defaults
            cfg.cmd_repair ||
            '--repair --upgrade --dbpath .'
        ).split(' '),
        opt:{
            cwd: cwd,
            detached: false,
            stdio:[
                'ignore'
                ,fs.openSync(lf,'a+')
                ,fs.openSync(lf,'a+')
            ]
        }
    }
    mongod = cp.spawn(cmd.bin, cmd.arg, cmd.opt)
    if(!mongod.pid || mongod.exitCode){
        throw new Error('!FATAL spawn repairing `mongod` exit code: ' + mongod.exitCode)
    }
    log('^ `mongod` repair start pid:', mongod.pid)

    return mongod.on('close',
    function spawn_mongod_main(code){
        log('$ `mongod` repair stop')
        if(code !== 0){// sometimes w7 errors are: -529697949 = 0xE06D7363
            if(100 == code){// maybe `mongod` is running, try to restart
                //!!!dev return respawn_mongod_main(cwd)
                return mongodb_connect()//!!!devel
            } else {
                throw new Error('!FATAL `mongod` repair exit code: ' + code)
            }
        }
        cmd.opt.detached = true
        cmd.arg = (cfg.cmd_launch ||
            // optimizations
            '--noprealloc --smallfiles --directoryperdb ' +
            // basic
            '--journal --rest --httpinterface --quiet ' +
            // connection / path
            '--bind_ip 127.0.0.1 --port 27727 --dbpath .'
        ).split(' ')

        mongod = cp.spawn(cmd.bin, cmd.arg, cmd.opt)
        if(!mongod.pid || mongod.exitCode){
            throw new Error('!FATAL spawn `mongod` exit code: ' + mongod.exitCode)
        }
        mongod.on('close', function(code){
            if(code !== 0){// unhandled
                throw new Error('!FATAL close `mongod` exit code: ' + code)
            }
            mongod = code
            log('$ `mongod` stop')
        })
        log('^ `mongod` start pid:', mongod.pid)
        // connect `app` with `db`
        return mongodb_connect()
    })
}

function respawn_mongod_main(cwd){
    throw new Error(
        '!Restart is not impemented. Stop `mongod` manually. Then restart Application.'
    )
}

function mongodb_connect(config, app_api){
   /* Any data in SUPRO transport is being copied globally on every object
    * (or node) of the system, thus `_id`s on every side may collide with
    * locally generated data.
    *
    * So _id's are generated on Mongod's server side and play role only inside
    * local MongoDB.
    *
    * * NOTE: fatal errors and/or crashes inside DB callbacks can not use
    * *       `res.json()` to report UI and that. Timeout will fire in UI
    * *        and `bufferMaxEntries: 0` here
    * */

    if(db){
        return log('Already connected')// permanent `db` setup for app
    }

    if(config && app_api){
        cfg = config
        api = app_api
        cfg.options = config && config.options || {
            db:{
                forceServerObjectId: true
               ,bufferMaxEntries: 0//??? doesn't work
               ,journal: true
            }
           ,server: {
                auto_reconnect: true
               ,socketOptions:{
                    connectTimeoutMS: 512
                   ,socketTimeoutMS: 512
                }
            }
        }
        cfg.url = config && (config.url + config.db_name)
                         || 'mongodb://127.0.0.1:27727/supro_GLOB'
    }
    return mongodb.MongoClient.connect(
        cfg.url, cfg.options, on_connect_app
    )
}//mongodb_connect

function on_connect_app(err ,newdb){
    if(err || !newdb){
        log('!Error MongoClient.connect:', err || '!`newdb`')
        return setTimeout(
            function reconnect(){
                mongodb_connect()
            },
            4096
        )
    }

    db = mongodbAPI.client = newdb
    db.on('error', function on_db_err(err){// see NOTE above
        db.status = ''
        err && log('!db error: ', err.stack || err)
    })
    db.on('timeout', function on_db_timeout(conn){
        db.status = ''
        conn && log('$db timeout: ' + conn.host + ':' + conn.port)
    })
    db.on('close', function on_db_close(conn){
        db.status = ''
        conn && log('$db close: ' + conn.host + ':' + conn.port)
    })

    db.on('reconnect', function on_db_close(conn){
        db_admin()
    })

    // `collection` from the driver is not the only thing we need here
    // there can be other info stored inside this objects e.g. `meta`
    db.getCollection = function getCollection(name){// using cache
        if(!colls_cache[name]){// name is `collectionName`
            colls_cache[name] = db.collection(name)
        }
        return colls_cache[name]
    }
    db.ObjectId = mongodb.ObjectID

    return db_admin()

    function db_admin(){
        return db.admin(function on_admin(aerr ,a){
            if(aerr){
                log('db.admin():', aerr)
                return on_connect_app()// reconnect
            }
            return a.command({ buildInfo: 1 } ,function(e ,d){
                if(e){
                    log('db.admin.command():', e)
                    return on_connect_app()// reconnect
                }
                db.status = "MongoDB v" + d.documents[0]['version']
                log('Connected to ' + db.status)

                return api.db = db// finally provide `db`
            })
        })//cb admin
    }
}

/*
    function api_db_setup(err, db){
        if(err){
            log('FATAL supromongod:', err)
            return process.exit(1)// it's over, don't even launch
        }

        cfg.backend.ctl_on_close(
        function end_with_mongodb(req, res, next){
        // clean data base / db connection shutdown
        var body = ''

            api.db && api.db.admin(function (){

commandclose(true,
            function shutdown_mongodb(err){

            })


            /*api.db && api.db.close(true,
            function end_with_mongodb(err){

                err && (body += '! MongoDB close error:' + err + '\n')
                body += '^ MongoDB connection was closed\n'
                log(body)
                res.write(body)

                return next(err)
            })* /
        })
        return api.db = db
    }
*/

})(module)
