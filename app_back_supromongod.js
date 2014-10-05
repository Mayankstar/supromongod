/*
 * Run `mongod` and connect to it
 **/

module.exports = supromongod

function supromongod(api, cfg){
var n, fs, mongod
   ,app = api.app, name = 'supromongod'

    fs = require('fs')

    check_launch_daemon(
        api_db_setup
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

    function check_launch_daemon(cb){
    var cwd, d

        if(!cfg.bin) return cb()// don't launch if no binary is configured

        cwd = __dirname + '/../..' + (cfg.db_path || '/data/supromongod/')
        try {
            d = fs.statSync(cwd)
        } catch(ex){
            return require('mkdirp').mkdirp(cwd,
            function mkdirp_data_dir(err){
                if(err) throw err

                return spawn_mongod(cwd, cb)
            })
        }
        if(!d.isDirectory()){
            throw new Error('Is not a directory: ' + cwd)
        }
        return spawn_mongod(cwd, cb)
    }

    function spawn_mongod(cwd, cb){
    var cmd, lf, cp

        cp = require('child_process')

        lf = new Date()
        lf = cwd + lf.getUTCFullYear() + '-' + pad(lf.getUTCMonth() + 1) + '.txt'

        /* run repair stage */
        cmd = {
            bin: cfg.bin ? __dirname + '/' + cfg.bin : '/usr/local/bin/mongod',
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
            throw new Error('ERROR spawn repairing `mongod` exit code: ' + mongod.exitCode)
        }
        log('^ `mongod` repair start pid:', mongod.pid)
        mongod.on('close', function(code){
            log('$ `mongod` repair stop')
            if(code !== 0){// -529697949 0xE06D7363
                throw new Error('ERROR `mongod` repair exit code: ' + code)
            }
            cmd.opt.detached = true
            cmd.arg = (cfg.cmd_launch ||
                // optimizations
                '--noprealloc --smallfiles --directoryperdb ' +
                // basic
                '--journal --rest --httpinterface --quiet ' +
                // connection / path
                '--bind_ip 127.0.0.1 --port 27727 --dbpath ./'
            ).split(' ')

            mongod = cp.spawn(cmd.bin, cmd.arg, cmd.opt)
            if(!mongod.pid || mongod.exitCode){
                throw new Error('spawn `mongod` exit code: ' + mongod.exitCode)
            }
            mongod.on('close', function(code){
                if(code !== 0){// unhandled
                    throw new Error('close `mongod` exit code: ' + code)
                }
                mongod = code
                log('$ `mongod` stop')
            })
            log('^ `mongod` start pid:', mongod.pid)
        })
        return

//run exe, check in setinterval, cb, api.db = instance
/*
	 _mongo 'sts_running' 7>/dev/null 8>&7 && _con "OK

Stop mongod Processes

In a clean shutdown a mongod completes all pending operations,
flushes all data to data files, and closes all data files.
Other shutdowns are unclean and can compromise the validity the data files.

shutdown         { shutdown: 1 }
return a.command({ buildInfo: 1 } ,function(e ,d){
*/
    }

    function api_db_setup(){
        return require('./lib/mongodb.js').connect(cfg,
        function on_app_db(err, db){
            if(err){
                console.error('supromongod:', err)
                return process.exit(1)// it's over, don't even launch
            }

            cfg.backend.ctl_on_close(
            function(req, res, next){
                api.db && api.db.close(true,
                function end_with_mongodb(err){
                var body = ''
                //FIXME: check `serverStatus.metrics.cursor.open.total`
                    err && (body += '! MongoDB close error:' + err + '\n')
                    body += '^ MongoDB connection was closed\n'
                    log(body)
                    res.write(body)

                    return next(err)
                })
            })
            return api.db = db
        })
    }

    function pad(n){
        return n < 10 ? '0' + n : n
    }
}
