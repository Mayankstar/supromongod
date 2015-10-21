#!/bin/sh
# NOTE: "host" is hardcoded to '127.0.0.1',
#       "port" is 27727 or $NODEJS_CONFIG.supromongod.port

cd "${0%/*}/../node_apps/mongo-edit/" || {
    echo 'no directory found'
    exit 1
}

echo 'starting `mongo-edit` with hardcoded config "suproLocal.js" at URL
http://127.0.0.1:2764/

env $NODEJS_MONGO_DB may change default database name
env $NODEJS_MONGO_PORT may change TCP port

(ctrl+c to kill)'

NODE_PATH="${0%/*}/../../../node_modules"
export NODE_PATH

if [ "$NODEJS_CONFIG" ]
then
    : <<'__' # parse JS content to see database name, i.e.:
var DB = 'MAIN'// name is used in mongo-shell, mongo-export tools
          ^^^^
__
    NODEJS_MONGO_DB=${NODEJS_CONFIG##*var DB = [\'\"]}
    NODEJS_MONGO_DB=${NODEJS_MONGO_DB%%[\'\"]*}
    : <<'__' # parse JS content to see database port, i.e.:
        supromongod:{
            db_path: '/data/supromongod/' + DB + '_wiredTiger/',
            port: 27081,
                  ^^^^^
            db_name: DB
        },
__
    NODEJS_MONGO_PORT=`sed "/supromongod:{/,/}/{/ port *:/s_.*: *\([[:digit:]]*\).*_\1_p};d" <<EOF
$NODEJS_CONFIG
EOF
`
    [ "$NODEJS_MONGO_PORT" ] || NODEJS_MONGO_PORT=27727

    echo "
DB:  '$NODEJS_MONGO_DB'
PORT: $NODEJS_MONGO_PORT
"
    export NODEJS_MONGO_DB NODEJS_MONGO_PORT
fi

BINPATH="$PWD/../../../../"

case "$OSTYPE" in
*cygwin* | *msys*) # MS Windows
    [ -f "${BINPATH}node.exe" ] && NODE='node.exe'
    [ -f "${BINPATH}bin/node.exe" ] && NODE='bin/node.exe'
;;
*linux-gnu* | *linux_gnu* | *)
    [ -x "${BINPATH}bin/node" ] && NODE='bin/node'
;;
esac

[ "$NODE" ] || {
    # run from whatever PATH if empty check above
    BINPATH=''
    NODE='node'
}

"$BINPATH$NODE" server.js config/suproLocal.js
